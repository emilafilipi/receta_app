// server/controllers/adminController.js
const pool = require('../config/database');
const adminController = {
    getStats: async (req, res) => {
      try {
        const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM perdoruesit');
        const [recipesCount] = await pool.execute('SELECT COUNT(*) as count FROM recetat');
        const [pendingCount] = await pool.execute('SELECT COUNT(*) as count FROM recetat WHERE eshte_aprovuar = false');
  
        console.log('Stats:', { // Debug log
            users: usersCount[0].count,
            recipes: recipesCount[0].count,
            pending: pendingCount[0].count
          });

        res.json({
          totalUsers: usersCount[0].count,
          totalRecipes: recipesCount[0].count,
          pendingRecipes: pendingCount[0].count
        });
      } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ message: 'Server error' });
      }
    },
  
    getUsers: async (req, res) => {
      try {
        const [users] = await pool.execute('SELECT * FROM perdoruesit');
        res.json(users);
      } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error' });
      }
    },

    toggleUserStatus: async (req, res) => {
      const connection = await pool.getConnection();
      try {
        const { userId } = req.params;
        
        // Get current user's id for the trigger
        await connection.execute('SET @current_user_id = ?', [req.user.id]);
    
        // Get user details
        const [user] = await connection.execute(
          'SELECT * FROM perdoruesit WHERE perdoruesi_id = ?',
          [userId]
        );
    
        if (user.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Set the new status (toggle current status)
        const newStatus = user[0].eshte_aktiv ? 0 : 1;
    
        await connection.execute(
          'UPDATE perdoruesit SET eshte_aktiv = ? WHERE perdoruesi_id = ?',
          [newStatus, userId]
        );
    
        res.json({ message: 'User status updated successfully' });
    
      } catch (error) {
        console.error('Error toggling user status:', error);
        
        // Check for our custom error from trigger
        if (error.sqlState === '45000') {
          return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({ message: 'Server error' });
      } finally {
        connection.release();
      }
    },
  
    getRecipes: async (req, res) => {
      try {
        const [recipes] = await pool.execute(`
          SELECT r.*, p.emer_perdoruesi
          FROM recetat r
          JOIN perdoruesit p ON r.perdoruesi_id = p.perdoruesi_id
          ORDER BY r.krijuar_me DESC
        `);
        res.json(recipes);
      } catch (error) {
        console.error('Error getting recipes:', error);
        res.status(500).json({ message: 'Server error' });
      }
    },
  
    approveRecipe: async (req, res) => {
      try {
        await pool.execute(
          'UPDATE recetat SET eshte_aprovuar = true WHERE receta_id = ?',
          [req.params.id]
        );
        res.json({ message: 'Recipe approved successfully' });
      } catch (error) {
        console.error('Error approving recipe:', error);
        res.status(500).json({ message: 'Server error' });
      }
    },

    // deleteRecipe: async (req, res) => {
    //     try {
    //       const { id } = req.params;
    
    //       // Delete the recipe
    //       await pool.execute(
    //         'DELETE FROM recetat WHERE receta_id = ?',
    //         [id]
    //       );
    
    //       res.json({ message: 'Recipe deleted successfully' });
    //     } catch (error) {
    //       console.error('Error deleting recipe:', error);
    //       res.status(500).json({ message: 'Server error' });
    //     }
    //   },
    
    // server/controllers/adminController.js


    // server/controllers/adminController.js

    editRecipe: async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    // More detailed logging
    console.log('Headers:', req.headers);
    console.log('Full request:', req);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    // Basic validation
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('No data received');
    }

    await connection.beginTransaction();

    // Build the base query
    let query = `UPDATE recetat SET titulli = ?, pershkrimi = ?, koha_pergatitja = ?, 
                 koha_gatimi = ?, nr_racione = ?, eshte_aprovuar = ?`;
    
    let values = [
      req.body.titulli,
      req.body.pershkrimi,
      req.body.koha_pergatitja,
      req.body.koha_gatimi,
      req.body.nr_racione,
      req.body.eshte_aprovuar
    ];

    // Add image if present
    if (req.file) {
      query += `, url_media = ?`;
      values.push(JSON.stringify([`/uploads/recipe-images/${req.file.filename}`]));
    }

    // Add WHERE clause
    query += ` WHERE receta_id = ?`;
    values.push(id);

    // Execute the update
    await connection.execute(query, values);

    // Handle ingredients if present
    if (req.body.ingredients) {
      await connection.execute(
        'DELETE FROM perberes_receta WHERE receta_id = ?',
        [id]
      );

      const parsedIngredients = typeof req.body.ingredients === 'string' 
        ? JSON.parse(req.body.ingredients) 
        : req.body.ingredients;

      for (const ingredient of parsedIngredients) {
        await connection.execute(
          'INSERT INTO perberes_receta (receta_id, perberesi_id, sasia, njesia) VALUES (?, ?, ?, ?)',
          [id, ingredient.perberesi_id, ingredient.sasia, ingredient.njesia]
        );
      }
    }

    if (req.body.categories) {
      await connection.execute(
        'DELETE FROM kategori_receta WHERE receta_id = ?', 
        [id]
      );

      const categories = JSON.parse(req.body.categories);
      for (const category of categories) {
        await connection.execute(
          'INSERT INTO kategori_receta (receta_id, kategoria_id) VALUES (?, ?)',
          [id, category.kategoria_id]
        );
      }
    }

    if(req.body.steps) {
      await connection.execute(
                  'DELETE FROM hapat_receta WHERE receta_id = ?',
                  [id]
                );

                const parsedSteps = typeof req.body.steps === 'string' 
        ? JSON.parse(req.body.steps) 
        : req.body.steps;
            
                for (const step of parsedSteps) {
                  await connection.execute(
                    'INSERT INTO hapat_receta (receta_id, nr_hapi, pershkrimi) VALUES (?, ?, ?)',
                    [id, step.nr_hapi, step.pershkrimi]
                  );
                }
    }

    await connection.commit();
    res.json({ message: 'Recipe updated successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('Error updating recipe:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: err.sqlMessage || err.toString()
    });
  } finally {
    connection.release();
  }
},

getRecipeIngredients: async (req, res) => {
        try {
          const { id } = req.params;
          const [ingredients] = await pool.execute(`
            SELECT pr.*, p.emri
            FROM perberes_receta pr
            JOIN perberesit p ON pr.perberesi_id = p.perberesi_id
            WHERE pr.receta_id = ?
          `, [id]);
          console.log('Sending ingredients:', ingredients); // Debug log
          res.json(ingredients || []);
        } catch (error) {
          console.error('Error fetching recipe ingredients:', error);
          res.status(500).json({ message: 'Server error' });
        }
      },
  
    deleteRecipe: async (req, res) => {
      try {
        await pool.execute(
          'DELETE FROM recetat WHERE receta_id = ?',
          [req.params.id]
        );
        res.json({ message: 'Recipe deleted successfully' });
      } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  };

  

  // Make sure to export the controller
// module.exports = {
//   adminController,
//   toggleUserStatus
// };

module.exports = adminController;