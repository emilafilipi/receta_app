const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const auth = require('../middleware/auth');
const { recipeUpload } = require('../middleware/upload');

router.get('/', auth, recipeController.getAllRecipes);
router.get('/ingredients', recipeController.getAllIngredients);
router.get('/categories', recipeController.getCategories);
router.get('/filter-options', recipeController.getFilterOptions);
router.get('/my-recipes', auth, recipeController.getMyRecipes);
router.post('/', auth, recipeUpload.single('recipe_image'), recipeController.createRecipe);
router.get('/:id', recipeController.getRecipeById);
router.post('/:id/comments', auth, recipeController.addComment);
router.post('/:id/comments/:commentId/reply', auth, recipeController.addReply);
router.put('/comments/:komenti_id', auth, recipeController.updateComment);
router.delete('/comments/:komenti_id', auth, recipeController.deleteComment);
router.post('/:id/rating', auth, recipeController.addRating);
router.get('/:id/rating', auth, recipeController.getUserRating);
router.post('/:id/favorite', auth, recipeController.toggleFavorite);
router.get('/:id/favorite', auth, recipeController.checkFavorite);
router.post('/ingredients', auth, recipeController.addNewIngredient);
router.post('/categories', auth, recipeController.createCategory);
router.get('/:id/ingredients', auth, recipeController.getRecipeIngredients);
router.get('/:id/steps', auth, recipeController.getRecipeSteps);
router.delete('/:id', auth, recipeController.deleteRecipe);
// router.put('/:id', auth, recipeController.updateRecipe);
router.put('/:id', auth, recipeUpload.single('recipe_image'), recipeController.updateRecipe);

// router.get('/ingredients', recipeController.getAllIngredients);

module.exports = router;