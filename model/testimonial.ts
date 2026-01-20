
import { Schema, model, Document } from 'mongoose';

export interface ITestimonial extends Document {
  caption: string;
  image: string;
}

const testimonialSchema = new Schema<ITestimonial>({
  caption: { type: String, required: true },
  image: { type: String, required: true },
}, { timestamps: true });

export default model<ITestimonial>('Testimonial', testimonialSchema);
