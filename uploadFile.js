const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});





// Create storage for categories
const storageCategory = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'categories', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional image transformation
  }
});

// Create storage for products
const storageProduct = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Create storage for posters
const storagePoster = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'posters',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Define multer instances
const uploadCategory = multer({ storage: storageCategory });
const uploadProduct = multer({ storage: storageProduct });
const uploadPosters = multer({ storage: storagePoster });

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters
};
