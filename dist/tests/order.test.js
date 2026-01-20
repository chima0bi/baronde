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
require("dotenv/config");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const orderroute_1 = __importDefault(require("../routes/orderroute"));
const order_1 = __importDefault(require("../model/order"));
const cart_1 = __importDefault(require("../model/cart"));
jest.mock('axios');
jest.mock('../model/order');
jest.mock('../model/cart');
jest.mock('../middleware/authtoken', () => ({
    authToken: jest.fn((req, res, next) => {
        req.user = { id: 'testUserId', email: 'test@example.com', role: 'user' };
        next();
    }),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/order/v1', orderroute_1.default);
const mockedAxios = axios_1.default;
describe('Order Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /order/v1/checkout', () => {
        it('should initiate checkout and return authorization URL', () => __awaiter(void 0, void 0, void 0, function* () {
            const cart = {
                items: [{ product: { _id: 'productId', name: 'Test Product', price: 100 }, quantity: 2 }],
            };
            cart_1.default.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(cart) });
            const order = { _id: new mongoose_1.default.Types.ObjectId(), save: jest.fn() };
            order_1.default.mockImplementation(() => order);
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
            const response = yield (0, supertest_1.default)(app)
                .post('/order/v1/checkout')
                .send({ shippingAddress: { street: '123 Test St', city: 'Test City', zipCode: '12345', country: 'Testland' }, phoneNumber: '1234567890' });
            expect(response.status).toBe(200);
            expect(response.body.data.authorization_url).toBe('https://paystack.com/pay/test-auth-url');
            expect(cart_1.default.findOne).toHaveBeenCalledWith({ user: 'testUserId' });
            expect(order_1.default).toHaveBeenCalled();
            expect(mockedAxios.post).toHaveBeenCalled();
        }));
        it('should return 400 if cart is empty', () => __awaiter(void 0, void 0, void 0, function* () {
            cart_1.default.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ items: [] }) });
            const response = yield (0, supertest_1.default)(app)
                .post('/order/v1/checkout')
                .send({ shippingAddress: { street: '123 Test St', city: 'Test City', zipCode: '12345', country: 'Testland' }, phoneNumber: '1234567890' });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Cart is empty.');
        }));
    });
    describe('GET /order/v1/verify-payment', () => {
        it('should verify payment and redirect to success URL', () => __awaiter(void 0, void 0, void 0, function* () {
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
            order_1.default.findById.mockResolvedValue(order);
            cart_1.default.findOneAndDelete.mockResolvedValue({});
            const response = yield (0, supertest_1.default)(app).get('/order/v1/verify-payment?reference=test-reference');
            expect(response.status).toBe(302);
            expect(response.header.location).toContain('payment-success');
            expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('test-reference'), expect.any(Object));
            expect(order_1.default.findById).toHaveBeenCalledWith('orderId');
            expect(cart_1.default.findOneAndDelete).toHaveBeenCalledWith({ user: 'testUserId' });
        }));
        it('should redirect to failed URL if payment was not successful', () => __awaiter(void 0, void 0, void 0, function* () {
            const paystackVerifyResponse = {
                data: {
                    status: true,
                    data: { status: 'failed' },
                },
            };
            mockedAxios.get.mockResolvedValue(paystackVerifyResponse);
            const response = yield (0, supertest_1.default)(app).get('/order/v1/verify-payment?reference=test-reference');
            expect(response.status).toBe(302);
            expect(response.header.location).toContain('payment-failed');
        }));
    });
});
