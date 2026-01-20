"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartcontroller_1 = require("../controllers/cartcontroller");
const authtoken_1 = require("../middleware/authtoken");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */
/**
 * @swagger
 * /cart/v1/:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/', authtoken_1.authToken, cartcontroller_1.addItemToCart);
/**
 * @swagger
 * /cart/v1/:
 *   get:
 *     summary: Get the user's cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: The user's cart
 */
router.get('/', authtoken_1.authToken, cartcontroller_1.getCart);
/**
 * @swagger
 * /cart/v1/item/{productId}:
 *   put:
 *     summary: Update the quantity of a cart item
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item quantity updated
 */
router.put('/item/:productId', authtoken_1.authToken, cartcontroller_1.updateCartItemQuantity);
/**
 * @swagger
 * /cart/v1/item/{productId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/item/:productId', authtoken_1.authToken, cartcontroller_1.removeCartItem);
/**
 * @swagger
 * /cart/v1/:
 *   delete:
 *     summary: Clear the user's cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', authtoken_1.authToken, cartcontroller_1.clearCart);
exports.default = router;
