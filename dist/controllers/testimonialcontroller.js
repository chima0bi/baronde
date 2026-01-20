"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.updateTestimonial = exports.getTestimonialById = exports.getTestimonials = exports.createTestimonial = void 0;
const testimonial_1 = __importDefault(require("../model/testimonial"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const createTestimonial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { caption } = req.body;
        if (!req.file) {
            res.status(400).json({ message: 'No image uploaded' });
        }
        const result = yield new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: 'testimonials' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            req.file && uploadStream.end(req.file.buffer);
        });
        const newTestimonial = new testimonial_1.default({
            caption,
            image: result.secure_url,
        });
        yield newTestimonial.save();
        res.status(201).json(newTestimonial);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createTestimonial = createTestimonial;
const getTestimonials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testimonials = yield testimonial_1.default.find();
        res.status(200).json(testimonials);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTestimonials = getTestimonials;
const getTestimonialById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testimonial = yield testimonial_1.default.findById(req.params.id);
        if (!testimonial) {
            res.status(404).json({ message: 'Testimonial not found' });
            return;
        }
        res.status(200).json(testimonial);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTestimonialById = getTestimonialById;
const updateTestimonial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { caption } = req.body;
        let image;
        if (req.file) {
            const result = yield new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: 'testimonials' }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                });
                req.file && uploadStream.end(req.file.buffer);
            });
            image = result.secure_url;
        }
        const updatedTestimonial = yield testimonial_1.default.findByIdAndUpdate(req.params.id, Object.assign({ caption }, (image && { image })), { new: true });
        if (!updatedTestimonial) {
            res.status(404).json({ message: 'Testimonial not found' });
            return;
        }
        res.status(200).json(updatedTestimonial);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateTestimonial = updateTestimonial;
const deleteTestimonial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedTestimonial = yield testimonial_1.default.findByIdAndDelete(req.params.id);
        if (!deletedTestimonial) {
            res.status(404).json({ message: 'Testimonial not found' });
            return;
        }
        res.status(200).json({ message: 'Testimonial deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteTestimonial = deleteTestimonial;
