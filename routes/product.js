const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const { uploadProduct } = require('../uploadFile.js');
const asyncHandler = require('express-async-handler');

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
        .populate('proCategoryId', 'id name')
        .populate('proSubCategoryId', 'id name')
        .populate('proBrandId', 'id name')
        .populate('proVariantTypeId', 'id type')
        .populate('proVariantId', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product retrieved successfully.", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Create new product
router.post('/', asyncHandler(async (req, res) => {
    try {
        // Execute the Multer middleware to handle multiple file fields
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                // Handle Multer errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB per image.';
                }
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
                return res.status(400).json({ success: false, message: "Required fields are missing." });
            }

            const imageUrls = [];

            // Iterate over file fields, upload to Cloudinary and store the URLs
            for (const field of ['image1', 'image2', 'image3', 'image4', 'image5']) {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const uploadResult = await cloudinary.uploader.upload(file.path); // Upload to Cloudinary
                    imageUrls.push({ image: index + 1, url: uploadResult.secure_url });
                }
            }

            const newProduct = new Product({
                name,
                description,
                quantity,
                price,
                offerPrice,
                proCategoryId,
                proSubCategoryId,
                proBrandId,
                proVariantTypeId,
                proVariantId,
                images: imageUrls
            });

            await newProduct.save();
            res.json({ success: true, message: "Product created successfully.", data: newProduct });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;
    try {
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            // Update product properties
            productToUpdate.name = name || productToUpdate.name;
            productToUpdate.description = description || productToUpdate.description;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.price = price || productToUpdate.price;
            productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
            productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
            productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
            productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
            productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;

            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            for (const [index, field] of fields.entries()) {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const uploadResult = await cloudinary.uploader.upload(file.path); // Upload to Cloudinary

                    let imageEntry = productToUpdate.images.find(img => img.image === (index + 1)); // Match by index + 1
                    if (imageEntry) {
                        imageEntry.url = uploadResult.secure_url;
                    } else {
                        productToUpdate.images.push({ image: index + 1, url: uploadResult.secure_url });
                    }
                }
            }

            // Save the updated product
            await productToUpdate.save();
            res.json({ success: true, message: "Product updated successfully." });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findById(productID);
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Delete images from Cloudinary
        for (const image of product.images) {
            const publicId = image.url.split('/').pop().split('.')[0]; // Extract the public_id from the URL
            await cloudinary.uploader.destroy(publicId); // Delete the image from Cloudinary
        }

        // Delete the product from the database
        await Product.findByIdAndDelete(productID);

        res.json({ success: true, message: "Product and associated images deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router; 