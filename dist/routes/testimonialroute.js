"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonialcontroller_1 = require("../controllers/testimonialcontroller");
const multer_1 = __importDefault(require("../utils/multer"));
const router = (0, express_1.Router)();
router.post('/', multer_1.default.single('image'), testimonialcontroller_1.createTestimonial);
router.get('/', testimonialcontroller_1.getTestimonials);
router.get('/:id', testimonialcontroller_1.getTestimonialById);
router.put('/:id', multer_1.default.single('image'), testimonialcontroller_1.updateTestimonial);
router.delete('/:id', testimonialcontroller_1.deleteTestimonial);
exports.default = router;
