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
exports.updateImage = exports.deleteImage = exports.getImagesByKeyword = exports.getImageById = exports.getCategories = exports.getImagesByName = exports.getImages = exports.uploadImage = void 0;
const image_1 = __importDefault(require("../model/image"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, brand, specs, description, price, categories, keyword, image, discount } = req.body;
        if (!image || (Array.isArray(image) && image.length === 0) || !name || !description || !price || !categories) {
            res.status(400).json({
                message: 'Input compulsory fields: at least one image, name, description, price and categories'
            });
            return;
        }
        const images = Array.isArray(image) ? image : [image];
        if (images.length > 4) {
            res.status(400).json({
                message: 'Maximum 4 images allowed per product'
            });
            return;
        }
        const imageUploadPromises = images.map((base64Image) => {
            return cloudinary_1.default.uploader.upload(base64Image, {
                folder: 'products'
            });
        });
        const uploadResults = yield Promise.all(imageUploadPromises);
        const newImage = new image_1.default({
            images: uploadResults.map(result => ({ public_id: result.public_id, url: result.secure_url })),
            brand: brand,
            name: name,
            spec: specs,
            description: description,
            categories: categories,
            price: price,
            discount: discount,
            keyword: Array.isArray(keyword) ? keyword : [keyword]
        });
        yield newImage.save();
        res.status(201).json({
            status: 'success',
            message: 'Product uploaded successfully',
            data: newImage
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.uploadImage = uploadImage;
const getImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const images = yield image_1.default.find();
        if (!images || images.length === 0) {
            res.status(404).json({ message: "No images have been uploaded yet" });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Images fetched successfully',
            count: images.length,
            data: images
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getImages = getImages;
const getImagesByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.params;
        const findImage = yield image_1.default.find({
            name: { $regex: name, $options: 'i' }
        });
        if (!findImage || findImage.length === 0) {
            res.status(404).json({
                status: 'error',
                message: 'No images found with that name'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Images fetched successfully',
            count: findImage.length,
            data: findImage
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            message: 'An error occurred while searching',
            error: error.message
        });
    }
});
exports.getImagesByName = getImagesByName;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categories } = req.params;
        const data = yield image_1.default.find({ categories });
        if (!data || data.length === 0) {
            res.status(404).json({
                status: "Not found",
                message: "No results"
            });
            return;
        }
        res.status(200).json({
            status: "success",
            message: "Fetched results successfully",
            count: data.length,
            data: data
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getCategories = getCategories;
const getImageById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const image = yield image_1.default.findById(id);
        if (!image) {
            res.status(404).json({
                status: 'error',
                message: 'Image not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Image fetched successfully',
            data: image
        });
    }
    catch (error) {
        console.error('Get image error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getImageById = getImageById;
const getImagesByKeyword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword } = req.params;
        const images = yield image_1.default.find({ keyword: { $in: [keyword] } });
        if (!images || images.length === 0) {
            res.status(404).json({ message: "No images found with that keyword" });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Images fetched successfully',
            count: images.length,
            data: images
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getImagesByKeyword = getImagesByKeyword;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const image = yield image_1.default.findById(id);
        if (!image) {
            res.status(404).json({
                status: 'error',
                message: 'Image not found'
            });
            return;
        }
        // Delete image from cloudinary
        const publicIds = image.images.map(img => img.public_id);
        if (publicIds.length > 0) {
            yield cloudinary_1.default.api.delete_resources(publicIds);
        }
        yield image_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            message: 'Image deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.deleteImage = deleteImage;
const updateImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, brand, specs, description, price, categories, keyword, discount, image } = req.body;
        let imageToUpdate = yield image_1.default.findById(id);
        if (!imageToUpdate) {
            res.status(404).json({ message: 'Image not found' });
            return;
        }
        if (image && Array.isArray(image) && image.length > 0) {
            const publicIds = imageToUpdate.images.map(img => img.public_id);
            if (publicIds.length > 0) {
                yield cloudinary_1.default.api.delete_resources(publicIds);
            }
            const imageUploadPromises = image.map((base64Image) => {
                return cloudinary_1.default.uploader.upload(base64Image, {
                    folder: 'products'
                });
            });
            const uploadResults = yield Promise.all(imageUploadPromises);
            imageToUpdate.images = uploadResults.map(result => ({ public_id: result.public_id, url: result.secure_url }));
        }
        if (name)
            imageToUpdate.name = name;
        if (brand)
            imageToUpdate.brand = brand;
        if (specs)
            imageToUpdate.spec = specs;
        if (description)
            imageToUpdate.description = description;
        if (price)
            imageToUpdate.price = price;
        if ('discount' in req.body)
            imageToUpdate.discount = discount;
        if (categories)
            imageToUpdate.categories = categories;
        if (keyword)
            imageToUpdate.keyword = Array.isArray(keyword) ? keyword : [keyword];
        const updatedImage = yield imageToUpdate.save();
        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: updatedImage
        });
    }
    catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.updateImage = updateImage;
// export const deleteAllImages = async (req: Request, res: Response) => {
//   try {
//     const images = await Image.find();
//     if (!images || images.length === 0) {
//       res.status(404).json({ message: "No images found to delete." });
//       return;
//     }
//     const publicIds = images.flatMap(image => image.images.map(img => img.public_id));
//     if (publicIds.length > 0) {
//       await cloudinary.api.delete_resources(publicIds);
//     }
//     await Image.deleteMany({});
//     res.status(200).json({
//       status: 'success',
//       message: 'All images have been deleted successfully.'
//     });
//   } catch (error) {
//     console.error('Delete All Images error:', error);
//     res.status(500).json({
//       message: 'Server error while deleting all images',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };
