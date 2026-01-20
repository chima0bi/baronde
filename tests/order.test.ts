import "dotenv/config";
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import orderRoutes from '../routes/orderroute';
import Order from '../model/order';
import Cart from '../model/cart';


jest.mock('axios');
jest.mock('../model/order');
jest.mock('../model/cart');


jest.mock('../middleware/authtoken', () => ({
  authToken: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'testUserId', email: 'test@example.com', role: 'user' };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use('/order/v1', orderRoutes);

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Order Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /order/v1/checkout', () => {
    it('should initiate checkout and return authorization URL', async () => {
      const cart = {
        items: [{ product: { _id: 'productId', name: 'Test Product', price: 100 }, quantity: 2 }],
      };
      (Cart.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(cart) });

      const order = { _id: new mongoose.Types.ObjectId(), save: jest.fn() };
      (Order as unknown as jest.Mock).mockImplementation(() => order);

      const paystackResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://paystack.com/pay/test-auth-url',
            reference: 'test-reference',
          },
        },
      };
      mockedAxios.post.mockResolvedValue(paystackResponse);

      const response = await request(app)
        .post('/order/v1/checkout')
        .send({ shippingAddress: { street: '123 Test St', city: 'Test City', zipCode: '12345', country: 'Testland' }, phoneNumber: '1234567890' });

      expect(response.status).toBe(200);
      expect(response.body.data.authorization_url).toBe('https://paystack.com/pay/test-auth-url');
      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'testUserId' });
      expect(Order).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should return 400 if cart is empty', async () => {
        (Cart.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue({ items: [] }) });
  
        const response = await request(app)
          .post('/order/v1/checkout')
          .send({ shippingAddress: { street: '123 Test St', city: 'Test City', zipCode: '12345', country: 'Testland' }, phoneNumber: '1234567890' });
  
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Cart is empty.');
      });
  });

  describe('GET /order/v1/verify-payment', () => {
    it('should verify payment and redirect to success URL', async () => {
        const paystackVerifyResponse = {
            data: {
              status: true,
              data: {
                status: 'success',
                reference: 'test-reference',
                metadata: { orderId: 'orderId' },
                gateway_response: 'Successful',
              },
            },
          };
          mockedAxios.get.mockResolvedValue(paystackVerifyResponse);
      
          const order = { _id: 'orderId', user: 'testUserId', save: jest.fn() };
          (Order.findById as jest.Mock).mockResolvedValue(order);
      
          (Cart.findOneAndDelete as jest.Mock).mockResolvedValue({});
      
          const response = await request(app).get('/order/v1/verify-payment?reference=test-reference');
      
          expect(response.status).toBe(302); 
          expect(response.header.location).toContain('payment-success');
          expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('test-reference'), expect.any(Object));
          expect(Order.findById).toHaveBeenCalledWith('orderId');
          expect(Cart.findOneAndDelete).toHaveBeenCalledWith({ user: 'testUserId' });
    });

    it('should redirect to failed URL if payment was not successful', async () => {
        const paystackVerifyResponse = {
          data: {
            status: true,
            data: { status: 'failed' },
          },
        };
        mockedAxios.get.mockResolvedValue(paystackVerifyResponse);
  
        const response = await request(app).get('/order/v1/verify-payment?reference=test-reference');
  
        expect(response.status).toBe(302);
        expect(response.header.location).toContain('payment-failed');
      });
  });
});
