const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { profileUpload } = require('../middleware/upload');

router.post('/login', authController.login);
router.post('/signup', profileUpload.single('profilePicture'), authController.signup);

module.exports = router;