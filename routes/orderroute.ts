import { Router } from 'express';
import { initiateCheckout, getOrders, getOrderById, updateOrder, verifyPayment } from '../controllers/ordercontroller';
import { authToken } from '../middleware/authtoken';
import { Admin } from '../middleware/rbac';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management
 */

/**
 * @swagger
 * /order/v1/checkout:
 *   post:
 *     summary: Initiate the checkout process
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Checkout initiated
 */
router.post('/checkout', authToken, initiateCheckout);
router.get('/verify-payment', verifyPayment);

/**
 * @swagger
 * /order/v1/:
 *   get:
 *     summary: Get all orders for the user
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: A list of orders
 */
router.get('/', authToken, getOrders);

/**
 * @swagger
 * /order/v1/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The order details
 */
router.get('/:id', authToken, getOrderById);

/**
 * @swagger
 * /order/v1/{id}/status:
 *   put:
 *     summary: Update the status of an order (Admin only)
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:id', authToken, Admin, updateOrder);

export default router;
