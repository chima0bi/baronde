import { Request, Response } from 'express';
import Order from '../model/order';
import { usermodel as User } from '../model/user';
import { IAuthRequest } from '../interface/types';

export const getOrderAnalytics = async (req: IAuthRequest, res: Response) => {
  try {
    const [
      users,
      totalRevenueResult,
      totalOrders,
      successfulPayments,
      pendingPayments,
    ] = await Promise.all([
      User.find().select('-password -otp -loginAttempts -lockUntil'),
      Order.aggregate([
        { $match: { orderStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'paid' }),
      Order.countDocuments({ orderStatus: 'pending' }),
    ]);

    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id }).populate('items.product');
        return {
          user,
          orders,
        };
      })
    );

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
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
