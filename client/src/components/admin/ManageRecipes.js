// src/components/admin/ManageRecipes.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditRecipeModal from './EditRecipeModal';

function ManageRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/recipes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recipeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to approve recipe');

      fetchRecipes(); // Refresh the list
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete recipe');

      fetchRecipes(); // Refresh the list
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${editingRecipe.receta_id}`, {
        method: 'PUT',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // body: JSON.stringify(formData)
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update recipe');

      // Refresh recipes list
      fetchRecipes();
      setEditingRecipe(null); // Close modal
    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (recipe) => {
    try {
      if (!recipe.url_media) return null;
  
      try {
        const mediaUrls = JSON.parse(recipe.url_media);
        return mediaUrls.length > 0 ? `http://localhost:5000${mediaUrls[0]}` : null;
      } catch {
        return `http://localhost:5000${recipe.url_media}`;
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  return (
    <div className="manage-recipes">
      <h2>Recetat</h2>
      {loading ? (
        <div>Duke u ngarkuar...</div>
      ) : (
        <>
        <table className="recipes-table">
          <thead>
            <tr>
              <th></th>
              <th>Titulli</th>
              <th>Autori</th>
              <th>Statusi</th>
              <th>Krijuar më</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(recipe => (
              <tr key={recipe.receta_id}>
                <td>
                  {recipe.url_media && (
                    <img 
                      src={getImageUrl(recipe)}
                      alt={recipe.titulli}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-recipe.jpg';
                      }}
                    />
                  )}
                  {/* {recipe.titulli} */}
                </td>
                <td onClick={() => navigate(`/recipe/${recipe.receta_id}`)} style={{ cursor: 'pointer'}}>{recipe.titulli}</td>

                <td>{recipe.emer_perdoruesi}</td>
                <td>{recipe.eshte_aprovuar ? 'Aprovuar' : 'Në pritje të aprovimit'}</td>
                <td>{new Date(recipe.krijuar_me).toLocaleDateString('en-GB', {separator: '.'}).replace(/\//g, '.')}</td>
                <td>
                  <div className="action-buttons">
                    {!recipe.eshte_aprovuar && (
                      <button 
                        className="approve-button"
                        onClick={() => handleApprove(recipe.receta_id)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="edit-button"
                    //   onClick={() => navigate(`/recipe/${recipe.receta_id}/edit`)}
                      onClick={() => handleEdit(recipe)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(recipe.receta_id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {editingRecipe && (
            <EditRecipeModal
              recipe={editingRecipe}
              onClose={() => setEditingRecipe(null)}
              onSave={handleSaveEdit}
            />
          )}
          </>
      )}
    </div>
  );
}

export default ManageRecipes;