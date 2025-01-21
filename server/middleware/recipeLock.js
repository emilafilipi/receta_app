const pool = require('../config/database');

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

const recipeLock = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const recipeId = req.params.id;
        const userId = req.user.id;

        // Check if recipe exists and get current lock status
        const [recipes] = await connection.execute(
            'SELECT locked_by, lock_timestamp FROM recetat WHERE receta_id = ?',
            [recipeId]
        );

        if (recipes.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const recipe = recipes[0];
        const now = new Date();

        // If recipe is locked by another user and lock hasn't expired
        if (recipe.locked_by && 
            recipe.locked_by !== userId && 
            recipe.lock_timestamp && 
            (now - recipe.lock_timestamp) < LOCK_TIMEOUT) {
            
            // Get the username of the user who has the lock
            const [users] = await connection.execute(
                'SELECT emer_perdoruesi FROM perdoruesit WHERE perdoruesi_id = ?',
                [recipe.locked_by]
            );

            await connection.rollback();
            return res.status(423).json({ 
                message: `Recipe is currently being edited by ${users[0].emer_perdoruesi}. Please try again later.` 
            });
        }

        // Update or acquire lock
        await connection.execute(
            'UPDATE recetat SET locked_by = ?, lock_timestamp = NOW() WHERE receta_id = ?',
            [userId, recipeId]
        );

        await connection.commit();
        next();

    } catch (error) {
        await connection.rollback();
        console.error('Lock middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

const releaseRecipeLock = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const recipeId = req.params.id;
        const userId = req.user.id;

        // Only release if this user holds the lock
        await connection.execute(
            'UPDATE recetat SET locked_by = NULL, lock_timestamp = NULL WHERE receta_id = ? AND locked_by = ?',
            [recipeId, userId]
        );

        await connection.commit();
        next();
    } catch (error) {
        await connection.rollback();
        console.error('Release lock error:', error);
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = { recipeLock, releaseRecipeLock };