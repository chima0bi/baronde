
import { Request, Response } from 'express';
import Testimonial, { ITestimonial } from '../model/testimonial';
import cloudinary from '../utils/cloudinary';

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { caption } = req.body;
    if (!req.file) {
      res.status(400).json({ message: 'No image uploaded' });
    }

    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'testimonials' },
        (error: any, result: any) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      req.file && uploadStream.end(req.file.buffer);
    });

    const newTestimonial: ITestimonial = new Testimonial({
      caption,
      image: result.secure_url,
    });

    await newTestimonial.save();
    res.status(201).json(newTestimonial);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find();
    res.status(200).json(testimonials);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      res.status(404).json({ message: 'Testimonial not found' });
      return
    }
    res.status(200).json(testimonial);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { caption } = req.body;
    let image: string | undefined;

    if (req.file) {
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'testimonials' },
          (error: any, result: any) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        req.file && uploadStream.end(req.file.buffer);
      });
      image = result.secure_url;
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { caption, ...(image && { image }) },
      { new: true }
    );

    if (!updatedTestimonial) {
      res.status(404).json({ message: 'Testimonial not found' });
      return
    }

    res.status(200).json(updatedTestimonial);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const deletedTestimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deletedTestimonial) {
      res.status(404).json({ message: 'Testimonial not found' });
      return
    }
    res.status(200).json({ message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
