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
exports.getOrderAnalytics = void 0;
const order_1 = __importDefault(require("../model/order"));
const user_1 = require("../model/user");
const getOrderAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [users, totalRevenueResult, totalOrders, successfulPayments, pendingPayments,] = yield Promise.all([
            user_1.usermodel.find().select('-password -otp -loginAttempts -lockUntil'),
            order_1.default.aggregate([
                { $match: { orderStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            order_1.default.countDocuments(),
            order_1.default.countDocuments({ orderStatus: 'paid' }),
            order_1.default.countDocuments({ orderStatus: 'pending' }),
        ]);
        const usersWithOrders = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const orders = yield order_1.default.find({ user: user._id }).populate('items.product');
            return {
                user,
                orders,
            };
        })));
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
        res.status(200).json({
            status: 'success',
            message: 'Order analytics fetched successfully',
            data: {
                usersWithOrders,
                totalRevenue,
                totalOrders,
                successfulPayments,
                pendingPayments,
            },
        });
    }
    catch (error) {
        console.error('Get order analytics error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.getOrderAnalytics = getOrderAnalytics;
