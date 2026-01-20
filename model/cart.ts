import { Schema, model, Document, Types } from 'mongoose';

interface ICartItem extends Document {
  product: Types.ObjectId;
  quantity: number;
}

interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
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

const CartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
}, { timestamps: true });

export default model<ICart>('Cart', CartSchema);