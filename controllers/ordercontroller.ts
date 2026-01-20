import { Response } from 'express';
import axios from 'axios';
import { Types } from 'mongoose';
import Cart from '../model/cart';
import Order from '../model/order';
import { IAuthRequest, IPopulatedProduct } from '../interface/types';
import { generateToken } from './usercontroller';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_TEST_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/order/v1/verify-payment';
const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL || 'http://localhost:5173/payment-success';
const FRONTEND_FAILED_URL = process.env.FRONTEND_FAILED_URL || 'http://localhost:5173/payment-failed';

export const initiateCheckout = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const { shippingAddress, phoneNumber } = req.body;

    if (!shippingAddress || !phoneNumber) {
      res.status(400).json({ message: 'Shipping address and phone number are required.' });
      return
    }

    const cart = await Cart.findOne({ user: userId }).populate<{ items: { product: IPopulatedProduct, quantity: number }[] }>('items.product');

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty.' });
      return
    }

    let subTotal = 0;
    const orderItems = cart.items.map((item: any) => {
      const product = item.product;
      if (!product || typeof product.price !== 'number' || !product._id) {
        throw new Error(`Invalid product data for product ID: ${item.product}`);
      }
      subTotal += product.price * item.quantity;
      return {
        product: new Types.ObjectId(product._id),
        quantity: item.quantity,
        price: product.price,
      };
    });

    const totalAmount = subTotal;

    let order = await Order.findOne({ user: userId, orderStatus: 'pending' });

    if (order) {
      order.items = orderItems;
      order.totalAmount = Math.round(totalAmount * 100) / 100;
      order.shippingAddress = shippingAddress;
      order.phoneNumber = phoneNumber;
    } else {
      order = new Order({
        user: userId,
        items: orderItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        shippingAddress: shippingAddress,
        phoneNumber: phoneNumber,
        orderStatus: 'pending',
      });
    }

    await order.save();

    const paystackData = {
      email: userEmail,
      amount: Math.round(order.totalAmount * 100),
      callback_url: CALLBACK_URL,
      metadata: {
        orderId: order._id.toString(),
        userId: userId,
      },
    };

    const response = await axios.post(`${PAYSTACK_API_URL}/transaction/initialize`, paystackData, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    order.paymentDetails = { reference: response.data.data.reference };
    order.paymentIntentId = response.data.data.reference; // Store the Paystack reference as paymentIntentId
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Checkout initiated. Redirect to payment gateway.',
      data: {
        authorization_url: response.data.data.authorization_url,
      }
    });

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Paystack API error:', error.response?.data);
      res.status(error.response?.status || 500).json({ message: 'Error initializing payment', details: error.response?.data });
      return
    }
    console.error('Initiate checkout error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const verifyPayment = async (req: IAuthRequest, res: Response) => {
  try {
    const { reference } = req.query;

    if (!reference || typeof reference !== 'string') {
      res.status(400).redirect(FRONTEND_FAILED_URL + '?error=no_reference');
      return
    }

    const response = await axios.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const { status, data } = response.data;

    // find the order using the paymentIntentId 
    const order = await Order.findOne({ paymentIntentId: reference });

    if (!order) {
      // could happen if the order was abandoned and expired due to TTL, or a malicious attempt
      console.warn(`Order with paymentIntentId ${reference} not found during verification.`);
      res.redirect(FRONTEND_FAILED_URL + `?error=order_not_found_or_expired`);
      return;
    }

    if (status && data.status === 'success') {
      //  If order is already paid, redirect to success
      if (order.orderStatus === 'paid') {
        res.redirect(FRONTEND_SUCCESS_URL + `?orderId=${order._id.toString()}&message=already_paid`);
        return;
      }

      // Amount mismatch check
      const expectedAmount = Math.round(order.totalAmount * 100);
      if (expectedAmount !== data.amount) {
        console.error(`Amount mismatch for order ${order._id}. Expected ${expectedAmount}, got ${data.amount}`);
        order.orderStatus = 'cancelled';
        await order.save();
        res.redirect(FRONTEND_FAILED_URL + `?error=amount_mismatch`);
        return;
      }


      order.orderStatus = 'paid';
      order.paymentDetails = {
        reference: data.reference,
        status: data.status,
        gatewayResponse: data.gateway_response,
      };
      await order.save();


      await Cart.findOneAndDelete({ user: order.user });

      const token = generateToken(order.user.toString());
      res.redirect(`${FRONTEND_SUCCESS_URL}?orderId=${order._id.toString()}&token=${token}`);
      return;
    } else {
      order.orderStatus = 'cancelled';
      order.paymentDetails = {
        reference: data.reference,
        status: data.status,
        gatewayResponse: data.gateway_response,
      };
      await order.save();
      return res.redirect(FRONTEND_FAILED_URL + `?error=payment_failed`);
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('Paystack verification error:', error.response?.data);
      res.status(error.response?.status || 500).redirect(FRONTEND_FAILED_URL + '?error=verification_failed');
      return
    }
    console.error('Payment verification error:', error);
    res.status(500).redirect(FRONTEND_FAILED_URL + '?error=server_error');
  }
};

export const getOrders = async (req: IAuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const orders = await Order.find({ user: userId }).populate('items.product');

    if (!orders || orders.length === 0) {
      res.status(404).json({ message: 'No orders found for this user.' });
      return
    }

    res.status(200).json({ status: 'success', message: 'Orders fetched successfully', data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getOrderById = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const order = await Order.findOne({ _id: id, user: userId }).populate('items.product');

    if (!order) {
      res.status(404).json({ message: 'Order not found or does not belong to this user.' });
      return
    }

    res.status(200).json({ status: 'success', message: 'Order fetched successfully', data: order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateOrder = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus, deliveryDate } = req.body;

    if (orderStatus && !['paid', 'shipped', 'delivered', 'processing'].includes(orderStatus)) {
      res.status(400).json({ message: 'Invalid order status.' });
      return;
    }

    if (deliveryDate && isNaN(new Date(deliveryDate).getTime())) {
      res.status(400).json({ message: 'Invalid delivery date.' });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (deliveryDate) {
      order.deliveryDate = new Date(deliveryDate);
    }

    await order.save();

    res.status(200).json({ status: 'success', message: 'Order updated successfully', data: order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
