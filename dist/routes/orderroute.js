"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ordercontroller_1 = require("../controllers/ordercontroller");
const authtoken_1 = require("../middleware/authtoken");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
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
router.post('/checkout', authtoken_1.authToken, ordercontroller_1.initiateCheckout);
router.get('/verify-payment', ordercontroller_1.verifyPayment);
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
router.get('/', authtoken_1.authToken, ordercontroller_1.getOrders);
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
router.get('/:id', authtoken_1.authToken, ordercontroller_1.getOrderById);
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
router.put('/:id', authtoken_1.authToken, rbac_1.Admin, ordercontroller_1.updateOrder);
exports.default = router;
