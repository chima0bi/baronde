
import { Router } from 'express';
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialcontroller';
import upload from '../utils/multer';

const router = Router();

router.post('/', upload.single('image'), createTestimonial);
router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);
router.put('/:id', upload.single('image'), updateTestimonial);
router.delete('/:id', deleteTestimonial);

export default router;
