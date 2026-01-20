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
exports.clearCart = exports.removeCartItem = exports.updateCartItemQuantity = exports.getCart = exports.addItemToCart = void 0;
const cart_1 = __importDefault(require("../model/cart"));
const image_1 = __importDefault(require("../model/image"));
const addItemToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId, quantity } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!productId || !quantity) {
            res.status(400).json({ message: 'Product ID and quantity are required.' });
            return;
        }
        const product = yield image_1.default.findById(productId);
        if (!product) {
            res.status(404).json({ message: 'Product not found.' });
            return;
        }
        let cart = yield cart_1.default.findOne({ user: userId });
        if (!cart) {
            cart = new cart_1.default({ user: userId, items: [] });
        }
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        }
        else {
            cart.items.push({ product: productId, quantity });
        }
        yield cart.save();
        res.status(200).json({ status: 'success', message: 'Item added to cart successfully', data: cart });
    }
    catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.addItemToCart = addItemToCart;
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const cart = yield cart_1.default.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            res.status(404).json({ message: 'Cart not found for this user.' });
            return;
        }
        res.status(200).json({ status: 'success', message: 'Cart fetched successfully', data: cart });
    }
    catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.getCart = getCart;
const updateCartItemQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!quantity || quantity <= 0) {
            res.status(400).json({ message: 'Quantity must be a positive number.' });
            return;
        }
        const cart = yield cart_1.default.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found.' });
            return;
        }
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            yield cart.save();
            res.status(200).json({ status: 'success', message: 'Item quantity updated successfully', data: cart });
        }
        else {
            res.status(404).json({ message: 'Item not found in cart.' });
        }
    }
    catch (error) {
        console.error('Update cart item quantity error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.updateCartItemQuantity = updateCartItemQuantity;
const removeCartItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const cart = yield cart_1.default.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found.' });
            return;
        }
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        if (cart.items.length === initialLength) {
            res.status(404).json({ message: 'Item not found in cart.' });
            return;
        }
        yield cart.save();
        res.status(200).json({ status: 'success', message: 'Item removed from cart successfully', data: cart });
    }
    catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.removeCartItem = removeCartItem;
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const cart = yield cart_1.default.findOne({ user: userId });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found.' });
            return;
        }
        cart.items = [];
        yield cart.save();
        res.status(200).json({ status: 'success', message: 'Cart cleared successfully', data: cart });
    }
    catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});
exports.clearCart = clearCart;
