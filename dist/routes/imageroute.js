"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imagecontroller_1 = require("../controllers/imagecontroller");
const authtoken_1 = require("../middleware/authtoken");
const router = (0, express_1.Router)();
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
router.post('/upload', authtoken_1.authToken, imagecontroller_1.uploadImage);
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
router.get('/', imagecontroller_1.getImages);
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
router.get("/name/:name", imagecontroller_1.getImagesByName);
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
router.get("/categories/:categories", imagecontroller_1.getCategories);
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
router.get("/keyword/:keyword", imagecontroller_1.getImagesByKeyword);
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
router.get("/product/:id", imagecontroller_1.getImageById);
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
router.delete("/product/:id", authtoken_1.authToken, imagecontroller_1.deleteImage);
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
router.put("/product/:id", authtoken_1.authToken, imagecontroller_1.updateImage);
exports.default = router;
