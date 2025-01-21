// src/pages/Dashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import IngredientFilterModal from '../components/IngredientFilterModal';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    cuisine: '',
    favorites: false
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    difficultyLevels: [],
    cuisines: []
  });
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [strictIngredientMatch, setStrictIngredientMatch] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFilterOptions();
    fetchRecipes();
  }, []);

  const handleIngredientFilter = ({ ingredients, strictMatch }) => {
    setSelectedIngredients(ingredients);
    setStrictIngredientMatch(strictMatch);
    fetchRecipes(ingredients, strictMatch);
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/filter-options');
      if (!response.ok) throw new Error('Failed to fetch filter options');
      const data = await response.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

//   const fetchRecipes = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/recipes');
//       if (!response.ok) throw new Error('Failed to fetch recipes');
//       const data = await response.json();
//       setRecipes(data);
//     } catch (err) {
//       setError('Failed to load recipes');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

const fetchRecipes = async (ingredients = selectedIngredients, strict = strictIngredientMatch) => {
    try {

        let url = 'http://localhost:5000/api/recipes';
      
      if (ingredients.length > 0) {
        url += `?ingredients=${ingredients.join(',')}&strictMatch=${strict}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

    //   const response = await fetch('http://localhost:5000/api/recipes', {
    //     headers: {
    //       'Authorization': `Bearer ${localStorage.getItem('token')}`
    //     }
    //   });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    console.log('Filtering recipe:', {
        id: recipe.receta_id,
        title: recipe.titulli,
        category: recipe.kategoria_id,
        filterCategory: filters.category,
        is_favorite: recipe.is_favorite,
        showFavorites: filters.favorites
      });

    const matchesSearch = recipe.titulli.toLowerCase().includes(searchTerm.toLowerCase());
    // const matchesCategory = !filters.category || recipe.kategoria_id === parseInt(filters.category);
    const matchesCategory = !filters.category || 
    (recipe.categories && recipe.categories.some(cat => cat.id === parseInt(filters.category)));
 
    const matchesDifficulty = !filters.difficulty || recipe.veshtiresia_id === parseInt(filters.difficulty);
    const matchesCuisine = !filters.cuisine || recipe.lloji_kuzhines === filters.cuisine;
    const matchesFavorites = !filters.favorites || Boolean(recipe.is_favorite);
    // const matchesFavorites = !filters.favorites || recipe.is_favorite;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesCuisine && matchesFavorites;
  });

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
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <div className="search-filter-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Kërko receta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filters">
          {user && ( // Only show favorites filter for logged-in users
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.favorites}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    favorites: e.target.checked 
                  })}
                />
                Shfaq Vetëm Recetat e Preferuara
              </label>
            )}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              <option value="">Kategoritë</option>
              {filterOptions.categories.map(category => (
                <option key={category.kategoria_id} value={category.kategoria_id}>
                  {category.emri}
                </option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="filter-select"
            >
              <option value="">Nivelet e Vështirësisë</option>
              {filterOptions.difficultyLevels.map(level => (
                <option key={level.veshtiresia_id} value={level.veshtiresia_id}>
                  {level.emri}
                </option>
              ))}
            </select>

            <button
                onClick={() => setIsIngredientModalOpen(true)}
                className="filter-button"
            >
                Filtro sipas Përbërësve
            </button>

          </div>
        </div>

        {loading && <div className="loading">Duke ngarkuar recetat...</div>}
        {error && <div className="error-message">{error}</div>}
        <div className='recipes-container'>
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <div key={recipe.receta_id} 
                className="recipe-card" 
                onClick={() => navigate(`/recipe/${recipe.receta_id}`)} 
                style={{ cursor: 'pointer'}}>
            
              {recipe.url_media && (
                <img 
                  src={getImageUrl(recipe)}
                  alt={recipe.titulli} 
                  className="recipe-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-recipe.jpg';
                  }}
                />
              )}
              {user && recipe.is_favorite === 1 && (
                <div className="favorite-badge">
                  ❤️ E preferuar
                </div>
              )}
              <div className="recipe-content">
                <h3 className="recipe-title">{recipe.titulli}</h3>
                <p className="recipe-description">{recipe.pershkrimi}</p>
                <div className="recipe-meta">
                  <span> {recipe.veshtiresia}</span>
                  <span>•</span>
                  <span>⌚ {recipe.koha_gatimi} min</span>
                </div>
              </div>
              <div className="recipe-average-rating">
              {recipe.mesatarja_yjeve ? Number(recipe.mesatarja_yjeve).toFixed(1) : 'Nuk ka vlerësime'} 
              </div>
              
            </div>
          ))}
        </div>
      </div>
      {/* <div className="search-filter-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Kërko receta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filters">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              <option value="">Kategoritë</option>
              {filterOptions.categories.map(category => (
                <option key={category.kategoria_id} value={category.kategoria_id}>
                  {category.emri}
                </option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="filter-select"
            >
              <option value="">Nivelet e Vështirësisë</option>
              {filterOptions.difficultyLevels.map(level => (
                <option key={level.veshtiresia_id} value={level.veshtiresia_id}>
                  {level.emri}
                </option>
              ))}
            </select>

            {user && ( // Only show favorites filter for logged-in users
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.favorites}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    favorites: e.target.checked 
                  })}
                />
                Shfaq Vetëm Recetat e Preferuara
              </label>
            )}

            <button
                onClick={() => setIsIngredientModalOpen(true)}
                className="filter-button"
            >
                Filtro sipas Përbërësve
            </button>

          </div>
        </div> */}
      </div>
      <IngredientFilterModal
            isOpen={isIngredientModalOpen}
            onClose={() => setIsIngredientModalOpen(false)}
            onApplyFilter={handleIngredientFilter}
            currentIngredients={selectedIngredients}
        />
        <Footer />
    </div>
  );
}

export default Dashboard;