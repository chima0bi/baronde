"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CartItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Image', // Reference to your existing Image/Product model
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
});
const CartSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // Reference to your User model
        required: true,
        unique: true,
    },
    items: [CartItemSchema],
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Cart', CartSchema);
