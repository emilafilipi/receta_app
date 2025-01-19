// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { recipeUpload } = require('../middleware/upload');


// Add adminAuth middleware to check if user is admin
router.use(auth, adminAuth);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/recipes', adminController.getRecipes);
router.get('/recipes/:id/ingredients', adminController.getRecipeIngredients);
router.put('/recipes/:id/approve', adminController.approveRecipe);
router.delete('/recipes/:id', adminController.deleteRecipe);
// router.put('/recipes/:id', adminController.editRecipe);
router.put('/recipes/:id', auth, adminAuth, recipeUpload.single('recipe_image'), adminController.editRecipe);
router.put('/users/:userId/toggle-status', auth, adminAuth, adminController.toggleUserStatus);


module.exports = router;