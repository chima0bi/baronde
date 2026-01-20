import { Schema, model, Document, Types } from 'mongoose';

interface IOrderItem {
  product: Types.ObjectId; // Reference to the Product model
  quantity: number;
  price: number; // Price at the time of purchase
}

// Interface for the structure of payment details from Paystack
interface IPaymentDetails {
  reference?: string;
  status?: string;
  gatewayResponse?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId; // Explicitly type the _id
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  deliveryDate: Date;
  orderStatus: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'processing';
  paymentDetails?: IPaymentDetails;
  paymentIntentId?: string; // New field for Paystack transaction reference
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Image', required: true },
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
OrderSchema.index(
  { "createdAt": 1 },
  { expireAfterSeconds: 600, partialFilterExpression: { orderStatus: "pending" } }
);

export default model<IOrder>('Order', OrderSchema);
