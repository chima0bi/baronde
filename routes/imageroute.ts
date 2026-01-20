import { Router } from 'express';
import { uploadImage, getImages, getImagesByName, getCategories, getImageById, getImagesByKeyword, deleteImage, updateImage } from '../controllers/imagecontroller';
import { authToken } from '../middleware/authtoken';
import { Admin } from "../middleware/rbac";
import upload from '../utils/multer';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Image
 *   description: Image management
 */

/**
 * @swagger
 * /image/v1/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Image]
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
/**
 * @swagger
 * tags:
 *   name: Image
 *   description: Image management
 */

/**
 * @swagger
 * /image/v1/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Image]
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/upload', authToken, uploadImage);

/**
 * @swagger
 * /image/v1/:
 *   get:
 *     summary: Get all images
 *     tags: [Image]
 *     responses:
 *       200:
 *         description: A list of images
 */
router.get('/',  getImages);

/**
 * @swagger
 * /image/v1/name/{name}:
 *   get:
 *     summary: Get images by name
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of images
 */
router.get("/name/:name",  getImagesByName);

/**
 * @swagger
 * /image/v1/categories/{categories}:
 *   get:
 *     summary: Get images by categories
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: categories
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of images
 */
router.get("/categories/:categories", getCategories);

/**
 * @swagger
 * /image/v1/keyword/{keyword}:
 *   get:
 *     summary: Get images by keyword
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of images
 */
router.get("/keyword/:keyword", getImagesByKeyword)

/**
 * @swagger
 * /image/v1/product/{id}:
 *   get:
 *     summary: Get an image by ID
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The image details
 */
router.get("/product/:id",  getImageById);

/**
 * @swagger
 * /image/v1/product/{id}:
 *   delete:
 *     summary: Delete an image by ID
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete("/product/:id", authToken, deleteImage);

/**
 * @swagger
 * /image/v1/product/{id}:
 *   put:
 *     summary: Update an image by ID
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image updated successfully
 */
router.put("/product/:id", authToken, updateImage);


export default router;