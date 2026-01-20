import { Request, Response } from 'express';
import Image from '../model/image';
import cloudinary from '../utils/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { name, brand, specs, description, price, categories, keyword, image, discount } = req.body;

    if (!image || (Array.isArray(image) && image.length === 0) || !name || !description || !price || !categories) {
      res.status(400).json({
        message: 'Input compulsory fields: at least one image, name, description, price and categories'
      });
      return
    }

    const images = Array.isArray(image) ? image : [image];

    if (images.length > 4) {
      res.status(400).json({
        message: 'Maximum 4 images allowed per product'
      });
      return

    }

    const imageUploadPromises = images.map((base64Image: string) => {
      return cloudinary.uploader.upload(base64Image, {
        folder: 'products'
      });
    });

    const uploadResults = await Promise.all(imageUploadPromises);

    const newImage = new Image({
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

    await newImage.save();
    res.status(201).json({
      status: 'success',
      message: 'Product uploaded successfully',
      data: newImage
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getImages = async (req: Request, res: Response) => {
  try {
    const images = await Image.find();
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getImagesByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const findImage = await Image.find({
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
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'An error occurred while searching',
      error: error.message
    });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { categories } = req.params;
    const data = await Image.find({ categories });

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getImageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

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
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getImagesByKeyword = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const images = await Image.find({ keyword: { $in: [keyword] } });
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

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
      await cloudinary.api.delete_resources(publicIds);
    }

    await Image.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, brand, specs, description, price, categories, keyword, discount, image } = req.body;

    let imageToUpdate = await Image.findById(id);

    if (!imageToUpdate) {
      res.status(404).json({ message: 'Image not found' });
      return
    }

    if (image && Array.isArray(image) && image.length > 0) {
      const publicIds = imageToUpdate.images.map(img => img.public_id);
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }

      const imageUploadPromises = image.map((base64Image: string) => {
        return cloudinary.uploader.upload(base64Image, {
          folder: 'products'
        });
      });
      const uploadResults = await Promise.all(imageUploadPromises);
      imageToUpdate.images = uploadResults.map(result => ({ public_id: result.public_id, url: result.secure_url }));
    }

    if (name) imageToUpdate.name = name;
    if (brand) imageToUpdate.brand = brand;
    if (specs) imageToUpdate.spec = specs;
    if (description) imageToUpdate.description = description;
    if (price) imageToUpdate.price = price;
    if ('discount' in req.body) imageToUpdate.discount = discount;
    if (categories) imageToUpdate.categories = categories;
    if (keyword) imageToUpdate.keyword = Array.isArray(keyword) ? keyword : [keyword];

    const updatedImage = await imageToUpdate.save();

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: updatedImage
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

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
