// src/pages/AddRecipe.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import '../styles/AddRecipe.css';

function AddRecipe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulli: '',
    pershkrimi: '',
    koha_pergatitja: '',
    koha_gatimi: '',
    nr_racione: '',
    veshtiresia_id: '',
    lloji_kuzhines: '',
    ingredients: [],
    steps: [], 
    categories: []
  });
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: ''
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // useEffect(() => {
  //   const fetchInitialData = async () => {
  //     try {
  //       const [filterOptionsRes] = await Promise.all([
  //         fetch('http://localhost:5000/api/recipes/filter-options')
  //       ]);
  
  //       const filterOptionsData = await filterOptionsRes.json();
  //       setAvailableCategories(filterOptionsData.categories);
  //     } catch (error) {
  //       console.error('Error fetching initial data:', error);
  //     }
  //   };
  
  //   fetchInitialData();
  // }, []);

  const fetchInitialData = async () => {
    try {
      const [ingredientsRes, difficultyRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:5000/api/recipes/ingredients'),
        fetch('http://localhost:5000/api/recipes/filter-options'),
        fetch('http://localhost:5000/api/recipes/categories')
      ]);

      const ingredients = await ingredientsRes.json();
      const { difficultyLevels: difficulties } = await difficultyRes.json();
      const categories = await categoriesRes.json();

      setAvailableIngredients(ingredients);
      setDifficultyLevels(difficulties);
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleIngredientAdd = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { perberesi_id: '', sasia: '', njesia: '' }]
    }));
  };

  const handleIngredientRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value
      };
      return {
        ...prev,
        ingredients: newIngredients
      };
    });
  };

  // Add category handlers
  const handleCategoryAdd = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, { kategoria_id: '', emri: '' }]
    }));
  };

  const handleCategoryRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  // const handleCategoryChange = (categoryId, isChecked) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     categories: isChecked 
  //       ? [...prev.categories, categoryId]
  //       : prev.categories.filter(id => id !== categoryId)
  //   }));
  // };

  const handleCategoryChange = (index, categoryId) => {
    setFormData(prev => {
      const newCategories = [...prev.categories];
      const selectedCategory = availableCategories.find(cat => cat.kategoria_id === parseInt(categoryId));
      newCategories[index] = {
        kategoria_id: selectedCategory.kategoria_id,
        emri: selectedCategory.emri
      };
      return { ...prev, categories: newCategories };
    });
  };
  
  const handleAddNewCategory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          emri: newCategory.name,
          pershkrimi: newCategory.description
        })
      });
  
      if (!response.ok) throw new Error('Failed to add category');
      const data = await response.json();
      
      setAvailableCategories(prev => [...prev, data]);
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, {
          kategoria_id: data.kategoria_id,
          emri: data.emri
        }]
      }));
      
      setNewCategory({ name: '', description: '' });
      setShowNewCategoryForm(false);
    } catch (error) {
      console.error('Error adding new category:', error);
    }
  };

  const handleStepAdd = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        nr_hapi: prev.steps.length + 1,
        pershkrimi: ''
    }]
    }));
  };

  const handleStepRemove = (index) => {
    setFormData(prev => {
      const newSteps = prev.steps.filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, nr_hapi: i + 1 }));
      return { ...prev, steps: newSteps };
    });
  };

  const handleStepChange = (index, field, value) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      // Object.keys(formData).forEach(key => {
      //   if (key === 'ingredients' || key === 'steps' || key === 'categories') {
      //     formDataToSend.append(key, JSON.stringify(formData[key]));
      //   } else {
      //     formDataToSend.append(key, formData[key]);
      //   }
      // });

      // formDataToSend.append('categories', JSON.stringify(formData.categories.map(cat => cat.kategoria_id)));

      formDataToSend.append('titulli', formData.titulli);
    formDataToSend.append('pershkrimi', formData.pershkrimi);
    formDataToSend.append('koha_pergatitja', formData.koha_pergatitja);
    formDataToSend.append('koha_gatimi', formData.koha_gatimi);
    formDataToSend.append('nr_racione', formData.nr_racione);
    formDataToSend.append('veshtiresia_id', formData.veshtiresia_id);
    formDataToSend.append('lloji_kuzhines', formData.lloji_kuzhines);
    formDataToSend.append('ingredients', JSON.stringify(formData.ingredients));
    formDataToSend.append('steps', JSON.stringify(formData.steps));
    // Update this line
    formDataToSend.append('categories', JSON.stringify(formData.categories.map(cat => cat.kategoria_id)));

    
      if (selectedImage) {
        formDataToSend.append('recipe_image', selectedImage);
      }

      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) throw new Error('Failed to create recipe');

      navigate('/my-recipes');
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Failed to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewIngredient = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          emri: newIngredient.name,
          njesia: newIngredient.unit
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add ingredient');
      }
      
      const data = await response.json();
      
      // Add the new ingredient to availableIngredients
      setAvailableIngredients(prev => [...prev, data]);
      
      // Add the new ingredient to the recipe's ingredients
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, {
          perberesi_id: data.perberesi_id,
          sasia: '',
          njesia: data.njesia
        }]
      }));
      
      // Reset form
      setNewIngredient({ name: '', unit: '' });
      setShowNewIngredientForm(false);
    } catch (error) {
    //   alert(error.message);
      console.error('Error adding new ingredient:', error);
      alert(error.message || 'Failed to add ingredient');
    }
  };

  return (
    <div className="add-recipe-page">
      <Navbar />
      <div className="add-recipe-container">
        <h1>Krijo Recetë të Re</h1>

        <form onSubmit={handleSubmit} className="add-recipe-form">
          <div className="form-section">
            {/* <h2>Basic Information</h2> */}
            
            <div className="form-group">
              <label>Titulli</label>
              <input
                type="text"
                value={formData.titulli}
                onChange={(e) => setFormData(prev => ({ ...prev, titulli: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Përshkrimi</label>
              <textarea
                value={formData.pershkrimi}
                onChange={(e) => setFormData(prev => ({ ...prev, pershkrimi: e.target.value }))}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Koha e Përgatitjes (min)</label>
                <input
                  type="number"
                  value={formData.koha_pergatitja}
                  onChange={(e) => setFormData(prev => ({ ...prev, koha_pergatitja: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Koha e Gatimit (min)</label>
                <input
                  type="number"
                  value={formData.koha_gatimi}
                  onChange={(e) => setFormData(prev => ({ ...prev, koha_gatimi: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Numri i Racioneve</label>
                <label></label>
                <label></label>
                <input
                  type="number"
                  value={formData.nr_racione}
                  onChange={(e) => setFormData(prev => ({ ...prev, nr_racione: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Niveli i Vështirësisë</label>
                <select
                  value={formData.veshtiresia_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, veshtiresia_id: e.target.value }))}
                  required
                >
                  <option value="">Zgjidh nivelin e vështirësisë</option>
                  {difficultyLevels.map(level => (
                    <option key={level.veshtiresia_id} value={level.veshtiresia_id}>
                      {level.emri}
                    </option>
                  ))}
                </select>
              </div>

                  <div className="form-group">
                    <label>Kategoria</label>
                    <div className="categories-header">
                      <button type="button" onClick={handleCategoryAdd} className="add-btn">
                        Përzgjidh kategori
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowNewCategoryForm(true)}
                        className="add-new-category-btn"
                      >
                        Krijo një kategori të re
                      </button>
                    </div>

                    {showNewCategoryForm && (
                      <div className="new-category-form">
                        <input
                          type="text"
                          placeholder="Emri i kategorisë"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                        />
                        <input
                          type="text"
                          placeholder="Përshkrimi"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                        <div className="new-category-actions">
                          <button 
                            type="button" 
                            onClick={handleAddNewCategory}
                            className="save-category-btn"
                          >
                            Ruaj kategorinë
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setShowNewCategoryForm(false);
                              setNewCategory({ name: '', description: '' });
                            }}
                            className="cancel-btn"
                          >
                            Anulo
                          </button>
                        </div>
                      </div>
                    )}

                    {formData.categories.map((category, index) => (
                      <div key={index} className="category-row">
                        <select
                          value={category.kategoria_id || ''}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          required
                        >
                          <option value="">Përzgjidh kategori</option>
                          {availableCategories.map(cat => (
                            <option key={cat.kategoria_id} value={cat.kategoria_id}>
                              {cat.emri}
                            </option>
                          ))}
                        </select>
                        
                        <button 
                          type="button" 
                          onClick={() => handleCategoryRemove(index)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
            </div>

            <div className="form-group">
              <label>Imazhi</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Recipe preview" 
                  className="image-preview"
                />
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Përbërësit</h3>
            <div className="ingredients-header">
                <button type="button" onClick={handleIngredientAdd} className="add-btn">
                Shto përbërës
                </button>
                <button 
                type="button" 
                onClick={() => setShowNewIngredientForm(true)}
                className="add-new-ingredient-btn"
                >
                Krijo një përbërës të ri
                </button>
            </div>

            {showNewIngredientForm && (
                <div className="new-ingredient-form">
                <input
                    type="text"
                    placeholder="Emri i përbërësit"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    name: e.target.value
                    }))}
                />
                <input
                    type="text"
                    placeholder="Njësia matëse (p.sh., kg, ml)"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    unit: e.target.value
                    }))}
                />
                <div className="new-ingredient-actions">
                    <button 
                    type="button" 
                    onClick={handleAddNewIngredient}
                    className="save-ingredient-btn"
                    >
                    Ruaj përbërësin
                    </button>
                    <button 
                    type="button" 
                    onClick={() => {
                        setShowNewIngredientForm(false);
                        setNewIngredient({ name: '', unit: '' });
                    }}
                    className="cancel-btn"
                    >
                    Anulo
                    </button>
                </div>
                </div>
            )}

            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <select
                  value={ingredient.perberesi_id}
                  onChange={(e) => handleIngredientChange(index, 'perberesi_id', e.target.value)}
                  required
                >
                  <option value="">Përzgjidh përbërës</option>
                  {availableIngredients.map(ing => (
                    <option key={ing.perberesi_id} value={ing.perberesi_id}>
                      {ing.emri}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Sasia"
                  value={ingredient.sasia}
                  onChange={(e) => handleIngredientChange(index, 'sasia', e.target.value)}
                  required
                />

                <input
                  type="text"
                  placeholder="Njësia matëse"
                  value={ingredient.njesia}
                  onChange={(e) => handleIngredientChange(index, 'njesia', e.target.value)}
                  required
                />

                <button 
                  type="button" 
                  onClick={() => handleIngredientRemove(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Hapat e Përgatitjes</h3>
            <button type="button" onClick={handleStepAdd} className="add-btn">
              Shto hap
            </button>

            {formData.steps.map((step, index) => (
              <div key={index} className="step-row">
                <div className="step-number">Hapi {step.nr_hapi}</div>
                <textarea
                  placeholder="Përshkrimi i hapit"
                  value={step.pershkrimi}
                  onChange={(e) => handleStepChange(index, 'pershkrimi', e.target.value)}
                  required
                />
                
                <button 
                  type="button" 
                  onClick={() => handleStepRemove(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/my-recipes')} className="cancel-btn">
              Anulo
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Duke ruajtur recetën...' : 'Krijo Recetën'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default AddRecipe;