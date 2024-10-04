const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const asyncHandler = require('express-async-handler');

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a category by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category retrieved successfully.", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new category with image upload
router.post('/', uploadCategory.single('img'), asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        let imageUrl = 'no_url';
        if (req.file && req.file.path) {
            imageUrl = req.file.path;  // Cloudinary provides the URL in 'path'
        }

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        const newCategory = new Category({
            name: name,
            image: imageUrl
        });
        await newCategory.save();
        res.json({ success: true, message: "Category created successfully.", data: newCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a category with image upload
router.put('/:id', uploadCategory.single('img'), asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        const { name } = req.body;
        let image = req.body.image;

        if (req.file && req.file.path) {
            image = req.file.path;  // Cloudinary image URL
        }

        if (!name || !image) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        const updatedCategory = await Category.findByIdAndUpdate(categoryID, { name: name, image: image }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category updated successfully.", data: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a category
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        // Check if any subcategories reference this category
        const subcategories = await SubCategory.find({ categoryId: categoryID });
        if (subcategories.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Subcategories are referencing it." });
        }

        // Check if any products reference this category
        const products = await Product.find({ proCategoryId: categoryID });
        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Products are referencing it." });
        }

        // If no subcategories or products are referencing the category, proceed with deletion
        const category = await Category.findByIdAndDelete(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
