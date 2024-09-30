const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../model/user');

// Secret key for JWT (store securely in environment variables in production)
const JWT_SECRET = 'your_jwt_secret_key';

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, message: "Users retrieved successfully.", data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Register a new user with hashed password
router.post('/register', asyncHandler(async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ success: false, message: "Name and password are required." });
    }

    try {
        // Check if the name is already taken
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Name is already taken." });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({ name, password: hashedPassword });
        const newUser = await user.save();
        
        res.json({ success: true, message: "User created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Login with password hashing and JWT token generation
router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }

        // Generate a JWT token
        const token = generateToken(user._id);

        // Authentication successful
        res.status(200).json({ success: true, message: "Login successful.", token, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a user by ID (protected route)
router.get('/:id', asyncHandler(verifyToken), asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User retrieved successfully.", data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Bearer token
    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Token is not valid." });
        }
        req.userId = decoded.id;
        next();
    });
}

// Update a user
router.put('/:id', asyncHandler(verifyToken), asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { name, password } = req.body;
        if (!name || !password) {
            return res.status(400).json({ success: false, message: "Name and password are required." });
        }

        // Hash the password before updating
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { name, password: hashedPassword },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user
router.delete('/:id', asyncHandler(verifyToken), asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
