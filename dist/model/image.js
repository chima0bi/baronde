"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const imageDataSchema = new mongoose_1.Schema({
    public_id: { type: String, required: true },
    url: { type: String, required: true }
});
const imageSchema = new mongoose_1.Schema({
    images: {
        type: [imageDataSchema],
        required: true,
        validate: {
            validator: function (images) {
                return images.length >= 1 && images.length <= 4;
            },
            message: 'A product must have between 1 and 4 images'
        }
    },
    name: { type: String, required: true },
    brand: { type: String },
    description: { type: String, required: true },
    categories: { type: String, required: true },
    spec: { type: String },
    price: { type: Number, required: true },
    keyword: { type: [String] },
    stockQuantity: { type: Number, default: 1 },
    discount: { type: Number, default: 0 }
}, {
    timestamps: true
});
imageSchema.index({ name: 'text', description: 'text' });
imageSchema.index({ categories: 1 });
imageSchema.index({ price: 1 });
const Image = (0, mongoose_1.model)('Image', imageSchema);
exports.default = Image;
