import { Schema, model } from 'mongoose';

interface IImageData {
  public_id: string;
  url: string;
}

interface IImage {
  images: IImageData[];
  name: string;
  brand: string;
  description: string;
  categories: string;
  spec: string;
  price: number;
  keyword: string[];
  stockQuantity?: number;
  discount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const imageDataSchema = new Schema<IImageData>({
  public_id: { type: String, required: true },
  url: { type: String, required: true }
});

const imageSchema = new Schema<IImage>({
  images: {
    type: [imageDataSchema],
    required: true,
    validate: {
      validator: function(images: IImageData[]) {
        return images.length >= 1 && images.length <= 4;
      },
      message: 'A product must have between 1 and 4 images'
    }
  },
  name: { type: String, required: true },
  brand: {type: String},
  description: { type: String, required: true },
  categories: { type: String, required: true },
  spec: { type: String },
  price: { type: Number, required: true },
  keyword: {type: [String]},
  stockQuantity: { type: Number, default: 1 },
  discount: { type: Number, default: 0 }
}, {
  timestamps: true
});


imageSchema.index({ name: 'text', description: 'text' });
imageSchema.index({ categories: 1 });
imageSchema.index({ price: 1 });

const Image = model<IImage>('Image', imageSchema);

export default Image;