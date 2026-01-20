import { Router } from 'express';
import { addItemToCart, getCart, updateCartItemQuantity, removeCartItem, clearCart } from '../controllers/cartcontroller';
import { authToken } from '../middleware/authtoken';

const router = Router();

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
router.post('/', authToken, addItemToCart);

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
router.get('/', authToken, getCart);

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
router.put('/item/:productId', authToken, updateCartItemQuantity);

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
router.delete('/item/:productId', authToken, removeCartItem);

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
router.delete('/', authToken, clearCart);

export default router;