"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OrderSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Image', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    phoneNumber: { type: String, required: true },
    deliveryDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'processing'],
        default: 'pending',
    },
    paymentDetails: {
        reference: { type: String },
        status: { type: String },
        gatewayResponse: { type: String },
    },
    paymentIntentId: { type: String, unique: true, sparse: true }, // Add this line
}, { timestamps: true });
// Create a TTL index for pending orders to expire after 10 minutes (600 seconds)
OrderSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 600, partialFilterExpression: { orderStatus: "pending" } });
exports.default = (0, mongoose_1.model)('Order', OrderSchema);
