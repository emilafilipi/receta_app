const pool = require('../config/database');

const recipeController = {
  // getAllRecipes: async (req, res) => {
  //   try {
  //     const [recipes] = await pool.execute(`
  //       SELECT r.*, nv.emri as veshtiresia
  //       FROM recetat r
  //       LEFT JOIN nivel_veshtiresie nv ON r.veshtiresia_id = nv.veshtiresia_id
  //       WHERE r.eshte_aprovuar = true
  //       ORDER BY r.krijuar_me DESC
  //     `);

  //     res.json(recipes);
  //   } catch (error) {
  //     console.error('Error fetching recipes:', error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // },

  getAllRecipes: async (req, res) => {
    
    try {
      const perdoruesi_id = req.user ? req.user.id : null;
      const selectedIngredients = req.query.ingredients;
      const strictMatch = req.query.strictMatch;

      console.log('Query params:', { selectedIngredients, strictMatch });
    let query = `
      SELECT DISTINCT
        r.*,
        nv.emri as veshtiresia,
        GROUP_CONCAT(DISTINCT k.kategoria_id) as category_ids,
        GROUP_CONCAT(DISTINCT k.emri) as category_names,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM preferuarat_perdoruesi pp 
            WHERE pp.receta_id = r.receta_id 
            AND pp.perdoruesi_id = ?
          ) 
          THEN 1 
          ELSE 0 
        END as is_favorite
      FROM recetat r
      LEFT JOIN nivel_veshtiresie nv ON r.veshtiresia_id = nv.veshtiresia_id
      LEFT JOIN kategori_receta kr ON r.receta_id = kr.receta_id
      LEFT JOIN kategorite k ON kr.kategoria_id = k.kategoria_id
      WHERE r.eshte_aprovuar = true

    `;

    const [favorites] = await pool.execute(
      'SELECT receta_id FROM preferuarat_perdoruesi WHERE perdoruesi_id = ?',
      [perdoruesi_id]
    );
    console.log('User favorites from database:', favorites);
    
      const queryParams = [req.user?.id || null];
      
      if (selectedIngredients && selectedIngredients.length > 0) {
        const ingredientIds = selectedIngredients.split(',').map(Number);

        if (strictMatch === 'true') {
          query += `
            AND r.receta_id IN (
              SELECT pr.receta_id
              FROM perberes_receta pr
              WHERE pr.perberesi_id IN (${ingredientIds.map(() => '?').join(',')})
              GROUP BY pr.receta_id
              HAVING COUNT(DISTINCT pr.perberesi_id) = ?
              AND COUNT(pr.perberesi_id) = ?
            )
          `;
          queryParams.push(...ingredientIds, ingredientIds.length, ingredientIds.length);
        } else {
          query += `
            AND r.receta_id IN (
              SELECT pr.receta_id
              FROM perberes_receta pr
              WHERE pr.perberesi_id IN (${ingredientIds.map(() => '?').join(',')})
              GROUP BY pr.receta_id
              
            )
          `;
          queryParams.push(...ingredientIds);
        }

      }

      query += `GROUP BY r.receta_id ORDER BY r.titulli ASC`;
  
      // Debug log
      console.log('Final query:', query);
      console.log('Query params:', queryParams);

      const [recipes] = await pool.execute(query, queryParams);

      console.log('Fetched recipes:', recipes.map(r => ({
        id: r.receta_id,
        title: r.titulli,
        category: r.kategoria_id,
        is_favorite: r.is_favorite
      })));

      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        categories: recipe.category_ids ? 
          recipe.category_ids.split(',').map((id, index) => ({
            id: parseInt(id),
            name: recipe.category_names.split(',')[index]
          })) 
          : []
      }));
  
      // Remove the concatenated fields we don't need in the final response
      processedRecipes.forEach(recipe => {
        delete recipe.category_ids;
        delete recipe.category_names;
      })

      res.json(processedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFilterOptions: async (req, res) => {
    try {
      // Get all categories
      const [categories] = await pool.execute(
        'SELECT kategoria_id, emri FROM kategorite'
      );

      // Get all difficulty levels
      const [difficultyLevels] = await pool.execute(
        'SELECT veshtiresia_id, emri FROM nivel_veshtiresie'
      );


      res.json({
        categories,
        difficultyLevels,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getRecipeById: async (req, res) => {
    try {
      // Get recipe basic info
      const [recipes] = await pool.execute(`
        SELECT r.*, nv.emri as veshtiresia, p.emer_perdoruesi as perdoruesi
        FROM recetat r
        LEFT JOIN nivel_veshtiresie nv ON r.veshtiresia_id = nv.veshtiresia_id
        JOIN perdoruesit p ON r.perdoruesi_id = p.perdoruesi_id
        WHERE r.receta_id = ?
      `, [req.params.id]);

      if (recipes.length === 0) {
        return res.status(404).json({ message: 'Recipe not found' });
      }

      const recipe = recipes[0];

      // Get ingredients
      const [ingredients] = await pool.execute(`
        SELECT p.*, pr.sasia, pr.njesia
        FROM perberes_receta pr
        JOIN perberesit p ON pr.perberesi_id = p.perberesi_id
        WHERE pr.receta_id = ?
      `, [req.params.id]);

      // Get steps
      const [steps] = await pool.execute(`
        SELECT *
        FROM hapat_receta
        WHERE receta_id = ?
        ORDER BY nr_hapi
      `, [req.params.id]);

      // Get comments
      const [comments] = await pool.execute(`
        SELECT k.*, p.emer_perdoruesi
        FROM komentet k
        JOIN perdoruesit p ON k.perdoruesi_id = p.perdoruesi_id
        WHERE k.receta_id = ?
        ORDER BY k.krijuar_me DESC
      `, [req.params.id]);

      // Get categories
      const [categories] = await pool.execute(`
        SELECT k.*
        FROM kategori_receta kr
        JOIN kategorite k ON kr.kategoria_id = k.kategoria_id
        WHERE kr.receta_id = ?
      `, [req.params.id]);

      // Get tags
      // const [tags] = await pool.execute(`
      //   SELECT t.*
      //   FROM tags_receta tr
      //   JOIN tags t ON tr.tags_id = t.tags_id
      //   WHERE tr.receta_id = ?
      // `, [req.params.id]);

      // Combine all data
      recipe.ingredients = ingredients;
      recipe.steps = steps;
      recipe.comments = comments;
      recipe.categories = categories;
      // recipe.tags = tags;

      res.json(recipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  addComment: async (req, res) => {
    try {
      console.log('Request params:', req.params);
      console.log('Request body:', req.body);

      const receta_id = parseInt(req.params.id);
      //const { receta_id } = req.params.id;
      const { permbajtja } = req.body;
      const perdoruesi_id = req.user.id; // From auth middleware

      console.log('Adding comment:', {
        receta_id,
        permbajtja,
        perdoruesi_id,
        user: req.user
      });

      const [result] = await pool.execute(
        'INSERT INTO komentet (perdoruesi_id, receta_id, permbajtja) VALUES (?, ?, ?)',
        [perdoruesi_id, receta_id, permbajtja]
      );

      // Fetch the newly created comment with user info
      const [newComment] = await pool.execute(`
        SELECT k.*, p.emer_perdoruesi 
        FROM komentet k
        JOIN perdoruesit p ON k.perdoruesi_id = p.perdoruesi_id
        WHERE k.komenti_id = ?
      `, [result.insertId]);

      res.status(201).json(newComment[0]);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  addReply: async (req, res) => {
    try {
      const { permbajtja, komenti_prind_id } = req.body;
      const receta_id = parseInt(req.params.id);
      //const { receta_id } = req.params.id;
      const perdoruesi_id = req.user.id;

      console.log({
        perdoruesi_id,
        receta_id,
        komenti_prind_id,
        permbajtja
      });
      
      const [result] = await pool.execute(
        'INSERT INTO komentet (perdoruesi_id, receta_id, komenti_prind_id, permbajtja) VALUES (?, ?, ?, ?)',
        [perdoruesi_id, receta_id, komenti_prind_id, permbajtja]
      );

      // Fetch the newly created reply with user info
      const [newReply] = await pool.execute(`
        SELECT k.*, p.emer_perdoruesi 
        FROM komentet k
        JOIN perdoruesit p ON k.perdoruesi_id = p.perdoruesi_id
        WHERE k.komenti_id = ?
      `, [result.insertId]);

      res.status(201).json(newReply[0]);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateComment: async (req, res) => {
    try {
      const { komenti_id } = req.params;
      const { permbajtja } = req.body;
      const perdoruesi_id = req.user.id;

      console.log("Updating comment:", { komenti_id, permbajtja, perdoruesi_id });

      // Verify comment ownership
      const [comment] = await pool.execute(
        'SELECT * FROM komentet WHERE komenti_id = ? AND perdoruesi_id = ?',
        [komenti_id, perdoruesi_id]
      );

      if (comment.length === 0) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await pool.execute(
        'UPDATE komentet SET permbajtja = ?, eshte_edituar = true WHERE komenti_id = ?',
        [permbajtja, komenti_id]
      );

      res.json({ message: 'Comment updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { komenti_id } = req.params;
      const perdoruesi_id = req.user.id;

      // Verify comment ownership
      const [comment] = await pool.execute(
        'SELECT * FROM komentet WHERE komenti_id = ? AND perdoruesi_id = ?',
        [komenti_id, perdoruesi_id]
      );

      if (comment.length === 0) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await pool.execute('DELETE FROM komentet WHERE komenti_id = ?', [komenti_id]);
      res.json({ message: 'Comment deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  // addRating: async (req, res) => {
  //   try {
  //     const receta_id = parseInt(req.params.id);
  //     // const { receta_id } = req.params;
  //     const { yjet } = req.body;
  //     const perdoruesi_id = req.user.id;

  //     console.log('Adding rating:', {
  //       receta_id,
  //       yjet,
  //       perdoruesi_id,
  //       user: req.user
  //     });

  //     // Check if user has already rated
  //     const [existingRating] = await pool.execute(
  //       'SELECT * FROM vleresimet WHERE perdoruesi_id = ? AND receta_id = ?',
  //       [perdoruesi_id, receta_id]
  //     );

  //     if (existingRating.length > 0) {
  //       await pool.execute(
  //         'UPDATE vleresimet SET yjet = ?, perditesuar_me = NOW() WHERE perdoruesi_id = ? AND receta_id = ?',
  //         [yjet, perdoruesi_id, receta_id]
  //       );
  //     } else {
  //       await pool.execute(
  //         'INSERT INTO vleresimet (perdoruesi_id, receta_id, yjet, krijuar_me) VALUES (?, ?, ?, NOW())',
  //         [perdoruesi_id, receta_id, yjet]
  //       );
  //     }

  //     // Update average rating
  //     const [ratings] = await pool.execute(
  //       'SELECT AVG(yjet) as avg_rating FROM vleresimet WHERE receta_id = ?',
  //       [receta_id]
  //     );

  //     // Update average rating in recipes table
  //     await updateAverageRating(receta_id);

  //     await pool.execute(
  //       'UPDATE recetat SET mesatarja_yjeve = ? WHERE receta_id = ?',
  //       [ratings[0].avg_rating, receta_id]
  //     );

  //     res.json({ message: 'Rating added/updated successfully' });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // },

  getUserRating: async (req, res) => {
    try {
      const receta_id = parseInt(req.params.id);
      const perdoruesi_id = req.user.id;

      const [rating] = await pool.execute(
        'SELECT yjet FROM vleresimet WHERE perdoruesi_id = ? AND receta_id = ?',
        [perdoruesi_id, receta_id]
      );

      if (rating.length === 0) {
        return res.json({ rating: null });
      }

      res.json({ rating: rating[0].yjet });
    } catch (error) {
      console.error('Error fetching user rating:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  addRating: async (req, res) => {
    try {
      const receta_id = parseInt(req.params.id);
      const { yjet } = req.body;
      const perdoruesi_id = req.user.id;

      // Check if user has already rated
      const [existingRating] = await pool.execute(
        'SELECT * FROM vleresimet WHERE perdoruesi_id = ? AND receta_id = ?',
        [perdoruesi_id, receta_id]
      );

      if (existingRating.length > 0) {
        await pool.execute(
          'UPDATE vleresimet SET yjet = ? WHERE perdoruesi_id = ? AND receta_id = ?',
          [yjet, perdoruesi_id, receta_id]
        );
      } else {
        await pool.execute(
          'INSERT INTO vleresimet (perdoruesi_id, receta_id, yjet) VALUES (?, ?, ?)',
          [perdoruesi_id, receta_id, yjet]
        );
      }

      // Calculate new average rating
      const [avgResult] = await pool.execute(
        'SELECT AVG(yjet) as avg_rating FROM vleresimet WHERE receta_id = ?',
        [receta_id]
      );

      const newAverage = avgResult[0].avg_rating;

      // Update average in recetat table
      await pool.execute(
        'UPDATE recetat SET mesatarja_yjeve = ? WHERE receta_id = ?',
        [newAverage, receta_id]
      );

      res.json({ 
        message: 'Rating added successfully',
        rating: yjet,
        averageRating: newAverage
      });
    } catch (error) {
      console.error('Error in addRating:', error);
      if (error.sqlState === '45000') {
        return res.status(403).json({ message: error.message });
      }
      throw error; 
      // res.status(500).json({ message: 'Server error' });
    }
  },

  toggleFavorite: async (req, res) => {
    try {
      const receta_id = parseInt(req.params.id);
      const perdoruesi_id = req.user.id;

      // Check if recipe is already favorited
      const [existing] = await pool.execute(
        'SELECT * FROM preferuarat_perdoruesi WHERE perdoruesi_id = ? AND receta_id = ?',
        [perdoruesi_id, receta_id]
      );

      if (existing.length > 0) {
        // Remove from favorites
        await pool.execute(
          'DELETE FROM preferuarat_perdoruesi WHERE perdoruesi_id = ? AND receta_id = ?',
          [perdoruesi_id, receta_id]
        );
        res.json({ isFavorite: false });
      } else {
        // Add to favorites
        await pool.execute(
          'INSERT INTO preferuarat_perdoruesi (perdoruesi_id, receta_id, krijuar_me) VALUES (?, ?, NOW())',
          [perdoruesi_id, receta_id]
        );
        res.json({ isFavorite: true });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (error.sqlState === '45000') {
        return res.status(403).json({ message: error.message });
      }
      throw error;
      // res.status(500).json({ message: 'Server error' });
    }
  },

  checkFavorite: async (req, res) => {
    try {
      const receta_id = parseInt(req.params.id);
      const perdoruesi_id = req.user.id;

      const [favorite] = await pool.execute(
        'SELECT * FROM preferuarat_perdoruesi WHERE perdoruesi_id = ? AND receta_id = ?',
        [perdoruesi_id, receta_id]
      );

      res.json({ isFavorite: favorite.length > 0 });
    } catch (error) {
      console.error('Error checking favorite:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllIngredients: async (req, res) => {
    try {
      const [ingredients] = await pool.execute(
        'SELECT perberesi_id, emri, njesia FROM perberesit ORDER BY emri ASC'
      );
      console.log('Fetched ingredients:', ingredients);
      res.json(ingredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // server/controllers/recipeController.js
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

  addNewIngredient: async (req, res) => {
    try {
      const { emri, njesia } = req.body;
  
      // Check if ingredient already exists
      const [existingIngredient] = await pool.execute(
        'SELECT * FROM perberesit WHERE emri = ?',
        [emri]
      );
  
      if (existingIngredient.length > 0) {
        return res.status(400).json({ 
          message: 'Ingredient already exists' 
        });
      }
  
      // Insert new ingredient
      const [result] = await pool.execute(
        'INSERT INTO perberesit (emri, njesia) VALUES (?, ?)',
        [emri, njesia]
      );
  
      // Return the new ingredient
      res.status(201).json({
        perberesi_id: result.insertId,
        emri,
        njesia
      });
    } catch (error) {
      console.error('Error adding new ingredient:', error);
      if (error.errno === 1644) {
        return res.status(400).json({ 
          message: 'An ingredient with this name already exists' 
        });
      }
      if (error.code === 'ER_SIGNAL_EXCEPTION' || error.errno === 1644) {
        return res.status(400).json({ 
          message: 'An ingredient with this name already exists' 
        });
      }
      // res.status(500).json({ message: 'Server error' });
      res.status(500).json({ 
        message: 'Failed to add ingredient. Please try again.' 
      });
    }
  },

  getRecipeSteps: async (req, res) => {
    try {
      const { id } = req.params;
      const [steps] = await pool.execute(`
        SELECT *
        FROM hapat_receta
        WHERE receta_id = ?
        ORDER BY nr_hapi
      `, [id]);
      
      res.json(steps || []);
    } catch (error) {
      console.error('Error fetching recipe steps:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getCategories: async (req, res) => {
    try {
      const [categories] = await pool.execute('SELECT * FROM kategorite ORDER BY emri');
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getMyRecipes: async (req, res) => {
    try {
      const [recipes] = await pool.execute(`
        SELECT r.*, nv.emri as veshtiresia
        FROM recetat r
        LEFT JOIN nivel_veshtiresie nv ON r.veshtiresia_id = nv.veshtiresia_id
        WHERE r.perdoruesi_id = ?
        ORDER BY r.krijuar_me DESC
      `, [req.user.id]);
  
      res.json(recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteRecipe: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership
      const [recipe] = await pool.execute(
        'SELECT * FROM recetat WHERE receta_id = ? AND perdoruesi_id = ?',
        [id, req.user.id]
      );
  
      if (recipe.length === 0) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      await pool.execute('DELETE FROM recetat WHERE receta_id = ?', [id]);
      res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

createCategory: async (req, res) => {
  try {
    const { emri, pershkrimi } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO kategorite (emri, pershkrimi) VALUES (?, ?)',
      [emri, pershkrimi]
    );

    res.status(201).json({
      kategoria_id: result.insertId,
      emri,
      pershkrimi
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
},

  updateRecipe: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      //  const { titulli, pershkrimi, koha_pergatitja, koha_gatimi, nr_racione, ingredients, steps } = req.body;
  
      console.log('Headers:', req.headers);
      console.log('Full request:', req);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      
      // Verify ownership
      const [recipe] = await connection.execute(
        'SELECT * FROM recetat WHERE receta_id = ? AND perdoruesi_id = ?',
        [id, req.user.id]
      );
  
      if (recipe.length === 0) {
        console.log('You have no recipes');
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      await connection.beginTransaction();

      // let imagePathUpdate = '';
      // let imagePathValue = null;

      // if (req.file) {
      //   const imagePath = `/uploads/${req.file.filename}`;
      //   imagePathUpdate = ', url_media = ?';
      //   imagePathValue = JSON.stringify([imagePath]);
      // }
  
      // // Update recipe details
      // await connection.execute(
      //   `UPDATE recetat 
      //    SET titulli = ?, pershkrimi = ?, koha_pergatitja = ?, 
      //        koha_gatimi = ?, nr_racione = ? ${imagePathUpdate}
      //    WHERE receta_id = ?`,
      //   [titulli, pershkrimi, koha_pergatitja, koha_gatimi, nr_racione, ...(imagePathValue ? [imagePathValue] : []), id]
      // );

      // Build the base query
    let query = `UPDATE recetat SET titulli = ?, pershkrimi = ?, koha_pergatitja = ?, 
    koha_gatimi = ?, nr_racione = ?`;

    let values = [
    req.body.titulli,
    req.body.pershkrimi,
    req.body.koha_pergatitja,
    req.body.koha_gatimi,
    req.body.nr_racione
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

    if (req.body.ingredients) {
      // Delete existing ingredients
      await connection.execute(
        'DELETE FROM perberes_receta WHERE receta_id = ?',
        [id]
      );

      // const parsedIngredients = typeof req.body.ingredients === 'string' 
      //   ? JSON.parse(req.body.ingredients) 
      //   : req.body.ingredients;

        const parsedIngredients = JSON.parse(req.body.ingredients);

      // Insert new ingredients
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

    if(req.body.steps){
      await connection.execute(
        'DELETE FROM hapat_receta WHERE receta_id = ?',
        [id]
      );
  
      // const parsedSteps = typeof req.body.steps === 'string' 
      //   ? JSON.parse(req.body.steps) 
      //   : req.body.steps;

      const parsedSteps = JSON.parse(req.body.steps);

      for (const step of parsedSteps) {
        await connection.execute(
          'INSERT INTO hapat_receta (receta_id, nr_hapi, pershkrimi) VALUES (?, ?, ?)',
          [id, step.nr_hapi, step.pershkrimi]
        );
      }
    }
  
      await connection.commit();

      const [updatedRecipe] = await connection.execute(
        `SELECT r.*, GROUP_CONCAT(p.emri) as ingredients
        FROM recetat r
        LEFT JOIN perberes_receta pr ON r.receta_id = pr.receta_id
        LEFT JOIN perberesit p ON pr.perberesi_id = p.perberesi_id
        WHERE r.receta_id = ?
        GROUP BY r.receta_id`,
        [id]
      );
  
      res.json({
        message: 'Recipe updated successfully',
        recipe: updatedRecipe[0]
      });

      // res.json({ message: 'Recipe updated successfully' });
  
    } catch (error) {
      await connection.rollback();
      console.error('Error updating recipe:', error);
      res.status(500).json({ message: 'Server error' });
    } finally {
      connection.release();
    }
  },

  createRecipe: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        titulli,
        pershkrimi,
        koha_pergatitja,
        koha_gatimi,
        nr_racione,
        veshtiresia_id,
        ingredients,
        steps,
        categories
      } = req.body;

      // Parse JSON strings back to objects
      const parsedIngredients = JSON.parse(ingredients);
      const parsedSteps = JSON.parse(steps);
      const parsedCategories = JSON.parse(categories); 

      // Validate ingredients before proceeding
      if (!parsedIngredients || parsedIngredients.length === 0) {
        throw new Error('A recipe must have at least one ingredient');
      }

      // Validate steps
      if (!parsedSteps || parsedSteps.length === 0) {
        throw new Error('A recipe must have at least one step');
      }

      const isApproved = req.user.role === 'admin' ? true : false;

      // Use the same path structure as profile pictures
      // const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const imagePaths = req.file ? JSON.stringify([`/uploads/recipe-images/${req.file.filename}`]) : JSON.stringify([]);

      // Create recipe
      // const [result] = await connection.execute(
      //   `INSERT INTO recetat (
      //     perdoruesi_id,
      //     titulli,
      //     pershkrimi,
      //     koha_pergatitja,
      //     koha_gatimi,
      //     nr_racione,
      //     veshtiresia_id,
      //     url_media,
      //     eshte_aprovuar,
      //     krijuar_me
      //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      //   [
      //     req.user.id,
      //     titulli,
      //     pershkrimi,
      //     koha_pergatitja,
      //     koha_gatimi,
      //     nr_racione,
      //     veshtiresia_id,
      //     imagePaths,
      //     isApproved
      //     // req.file ? `/uploads/recipe-images/${req.file.filename}` : null
      //   ]
      // );

      const [result] = await connection.execute(
        `INSERT INTO recetat SET
          perdoruesi_id = ?,
          titulli = ?,
          pershkrimi = ?,
          koha_pergatitja = ?,
          koha_gatimi = ?,
          nr_racione = ?,
          veshtiresia_id = ?,
          url_media = ?,
          eshte_aprovuar = ?,
          krijuar_me = NOW()`,
        [
          req.user.id,
          titulli,
          pershkrimi,
          koha_pergatitja,
          koha_gatimi,
          nr_racione,
          veshtiresia_id,
          imagePaths,
          isApproved
        ]
      );

      const recipeId = result.insertId;

      // Add ingredients
      for (const ingredient of parsedIngredients) {
        await connection.execute(
          'INSERT INTO perberes_receta (receta_id, perberesi_id, sasia, njesia) VALUES (?, ?, ?, ?)',
          [recipeId, ingredient.perberesi_id, ingredient.sasia, ingredient.njesia]
        );
      }

      // Add steps
      for (const step of parsedSteps) {
        await connection.execute(
          'INSERT INTO hapat_receta (receta_id, nr_hapi, pershkrimi) VALUES (?, ?, ?)',
          [recipeId, step.nr_hapi, step.pershkrimi]
        );
      }

      // Add categories
      for (const categoryId of parsedCategories) {
        await connection.execute(
          'INSERT INTO kategori_receta (receta_id, kategoria_id) VALUES (?, ?)',
          [recipeId, categoryId]
        );
      }

      await connection.commit();

      // Fetch the complete recipe
      const [recipe] = await connection.execute(`
        SELECT r.*, 
        GROUP_CONCAT(DISTINCT p.emri) as ingredients,
        GROUP_CONCAT(DISTINCT k.emri) as categories

        FROM recetat r
        LEFT JOIN perberes_receta pr ON r.receta_id = pr.receta_id
        LEFT JOIN perberesit p ON pr.perberesi_id = p.perberesi_id
        LEFT JOIN kategori_receta kr ON r.receta_id = kr.receta_id
        LEFT JOIN kategorite k ON kr.kategoria_id = k.kategoria_id
        WHERE r.receta_id = ?
        GROUP BY r.receta_id
      `, [recipeId]);

      res.status(201).json({
        message: 'Recipe created successfully',
        recipe: recipe[0]
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creating recipe:', error);
      res.status(500).json({ 
        message: 'Failed to create recipe',
        error: error.message 
      });
    } finally {
      connection.release();
    }
  }

};

// Helper function to update average rating
async function updateAverageRating(receta_id) {
  try {
    const [ratings] = await pool.execute(
      'SELECT AVG(yjet) as avg_rating FROM vleresimet WHERE receta_id = ?',
      [receta_id]
    );
    
    await pool.execute(
      'UPDATE recetat SET mesatarja_yjeve = ? WHERE receta_id = ?',
      [ratings[0].avg_rating, receta_id]
    );
  } catch (error) {
    console.error('Error updating average rating:', error);
  }
}

module.exports = recipeController;