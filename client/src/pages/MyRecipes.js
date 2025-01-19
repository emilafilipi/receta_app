// src/pages/MyRecipes.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EditRecipeModal from '../components/EditRecipeModal';
import { useAuth } from '../context/AuthContext';
import '../styles/MyRecipes.css';

function MyRecipes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);

  useEffect(() => {
    fetchMyRecipes();
  }, []);

  const fetchMyRecipes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/my-recipes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${editingRecipe.receta_id}`, {
        method: 'PUT',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // body: JSON.stringify(formData)
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update recipe');

      fetchMyRecipes(); // Refresh the list
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete recipe');
      fetchMyRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const getImageUrl = (recipe) => {
    try {
      if (!recipe.url_media) return null;
  
      // Try parsing as JSON first
      try {
        const mediaUrls = JSON.parse(recipe.url_media);
        return mediaUrls.length > 0 ? `http://localhost:5000${mediaUrls[0]}` : null;
      } catch {
        // If not JSON, treat as regular string
        return `http://localhost:5000${recipe.url_media}`;
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  return (
    <div className="my-recipes-page">
      <Navbar />
      <div className="my-recipes-container">
        <div className="page-header">
          <h1>Recetat e mia</h1>
          <button 
            className="add-recipe-btn"
            onClick={() => navigate('/recipes/new')}
          >
            Krjo një recetë të re
          </button>
        </div>

        {loading ? (
          <div className="loading">Duke ngarkuar recetat...</div>
        ) : (
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <div key={recipe.receta_id} className="recipe-card">
                {recipe.url_media && (
                    <img 
                        src={getImageUrl(recipe)}
                        alt={recipe.titulli} 
                        className="recipe-image"
                        onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-recipe.jpg'; // Add a placeholder image
                        }}
                    />
                )}
                <div className="recipe-content">
                  <h3>{recipe.titulli}</h3>
                  <p className="recipe-description">{recipe.pershkrimi}</p>
                  <div className="recipe-status">
                    Statusi: 
                    <span className={recipe.eshte_aprovuar ? 'approved' : 'pending'}>
                      {recipe.eshte_aprovuar ? 'E Aprovuar' : 'Duke pritur aprovim'}
                    </span>
                  </div>
                  <div className="recipe-actions">
                    <button 
                      onClick={() => handleEdit(recipe)}
                      className="edit-btn"
                    >
                      Modifiko recetën
                    </button>
                    <button 
                      onClick={() => handleDelete(recipe.receta_id)}
                      className="delete-btn"
                    >
                      Fshi recetën
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingRecipe && (
          <EditRecipeModal
            recipe={editingRecipe}
            onClose={() => setEditingRecipe(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default MyRecipes;