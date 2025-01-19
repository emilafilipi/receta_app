// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');

// router.put('/profile', auth, userController.updateProfile);

// server/routes/userRoutes.js
router.put('/profile', auth, profileUpload.single('profilePicture'), userController.updateProfile);

module.exports = router;