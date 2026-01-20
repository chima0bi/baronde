"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrder = exports.getOrderById = exports.getOrders = exports.verifyPayment = exports.initiateCheckout = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const cart_1 = __importDefault(require("../model/cart"));
const order_1 = __importDefault(require("../model/order"));
const usercontroller_1 = require("./usercontroller");
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_TEST_SECRET_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';
const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/order/v1/verify-payment';
const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL || 'http://localhost:5173/payment-success';
const FRONTEND_FAILED_URL = process.env.FRONTEND_FAILED_URL || 'http://localhost:5173/payment-failed';
const initiateCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        const { shippingAddress, phoneNumber } = req.body;
        if (!shippingAddress || !phoneNumber) {
            res.status(400).json({ message: 'Shipping address and phone number are required.' });
            return;
        }
        const cart = yield cart_1.default.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            res.status(400).json({ message: 'Cart is empty.' });
            return;
        }
        let subTotal = 0;
        const orderItems = cart.items.map((item) => {
            const product = item.product;
            if (!product || typeof product.price !== 'number' || !product._id) {
                throw new Error(`Invalid product data for product ID: ${item.product}`);
            }
            subTotal += product.price * item.quantity;
            return {
                product: new mongoose_1.Types.ObjectId(product._id),
                quantity: item.quantity,
                price: product.price,
            };
        });
        const totalAmount = subTotal;
        let order = yield order_1.default.findOne({ user: userId, orderStatus: 'pending' });
        if (order) {
            order.items = orderItems;
            order.totalAmount = Math.round(totalAmount * 100) / 100;
            order.shippingAddress = shippingAddress;
            order.phoneNumber = phoneNumber;
        }
        else {
            order = new order_1.default({
                user: userId,
                items: orderItems,
                totalAmount: Math.round(totalAmount * 100) / 100,
                shippingAddress: shippingAddress,
                phoneNumber: phoneNumber,
                orderStatus: 'pending',
            });
        }
        yield order.save();
        const paystackData = {
            email: userEmail,
            amount: Math.round(order.totalAmount * 100),
            callback_url: CALLBACK_URL,
            metadata: {
                orderId: order._id.toString(),
                userId: userId,
            },
        };
        const response = yield axios_1.default.post(`${PAYSTACK_API_URL}/transaction/initialize`, paystackData, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        order.paymentDetails = { reference: response.data.data.reference };
        order.paymentIntentId = response.data.data.reference; // Store the Paystack reference as paymentIntentId
        yield order.save();
        res.status(200).json({
            status: 'success',
            message: 'Checkout initiated. Redirect to payment gateway.',
            data: {
                authorization_url: response.data.data.authorization_url,
            }
        });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Paystack API error:', (_c = error.response) === null || _c === void 0 ? void 0 : _c.data);
            res.status(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 500).json({ message: 'Error initializing payment', details: (_e = error.response) === null || _e === void 0 ? void 0 : _e.data });
            return;
        }
        console.error('Initiate checkout error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.initiateCheckout = initiateCheckout;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { reference } = req.query;
        if (!reference || typeof reference !== 'string') {
            res.status(400).redirect(FRONTEND_FAILED_URL + '?error=no_reference');
            return;
        }
        const response = yield axios_1.default.get(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });
        const { status, data } = response.data;
        // find the order using the paymentIntentId 
        const order = yield order_1.default.findOne({ paymentIntentId: reference });
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
                yield order.save();
                res.redirect(FRONTEND_FAILED_URL + `?error=amount_mismatch`);
                return;
            }
            order.orderStatus = 'paid';
            order.paymentDetails = {
                reference: data.reference,
                status: data.status,
                gatewayResponse: data.gateway_response,
            };
            yield order.save();
            yield cart_1.default.findOneAndDelete({ user: order.user });
            const token = (0, usercontroller_1.generateToken)(order.user.toString());
            res.redirect(`${FRONTEND_SUCCESS_URL}?orderId=${order._id.toString()}&token=${token}`);
            return;
        }
        else {
            order.orderStatus = 'cancelled';
            order.paymentDetails = {
                reference: data.reference,
                status: data.status,
                gatewayResponse: data.gateway_response,
            };
            yield order.save();
            return res.redirect(FRONTEND_FAILED_URL + `?error=payment_failed`);
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Paystack verification error:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
            res.status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500).redirect(FRONTEND_FAILED_URL + '?error=verification_failed');
            return;
        }
        console.error('Payment verification error:', error);
        res.status(500).redirect(FRONTEND_FAILED_URL + '?error=server_error');
    }
});
exports.verifyPayment = verifyPayment;
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const orders = yield order_1.default.find({ user: userId }).populate('items.product');
        if (!orders || orders.length === 0) {
            res.status(404).json({ message: 'No orders found for this user.' });
            return;
        }
        res.status(200).json({ status: 'success', message: 'Orders fetched successfully', data: orders });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getOrders = getOrders;
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const order = yield order_1.default.findOne({ _id: id, user: userId }).populate('items.product');
        if (!order) {
            res.status(404).json({ message: 'Order not found or does not belong to this user.' });
            return;
        }
        res.status(200).json({ status: 'success', message: 'Order fetched successfully', data: order });
    }
    catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getOrderById = getOrderById;
const updateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const order = yield order_1.default.findById(id);
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
        yield order.save();
        res.status(200).json({ status: 'success', message: 'Order updated successfully', data: order });
    }
    catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.updateOrder = updateOrder;
