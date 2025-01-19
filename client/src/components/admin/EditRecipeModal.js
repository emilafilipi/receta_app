// src/components/admin/EditRecipeModal.js
import { useState, useEffect } from 'react';
import '../../styles/EditRecipeModal.css';

function EditRecipeModal({ recipe, onClose, onSave }) {

const [formData, setFormData] = useState({
    titulli: recipe?.titulli || '',
    pershkrimi: recipe?.pershkrimi || '',
    koha_pergatitja: recipe?.koha_pergatitja || '',
    koha_gatimi: recipe?.koha_gatimi || '',
    nr_racione: recipe?.nr_racione || '',
    eshte_aprovuar: recipe?.eshte_aprovuar || false,
    ingredients: [], // Initialize as empty array
    steps: [],
    categories: []
  });

  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        titulli: recipe.titulli || '',
        pershkrimi: recipe.pershkrimi || '',
        koha_pergatitja: recipe.koha_pergatitja || '',
        koha_gatimi: recipe.koha_gatimi || '',
        nr_racione: recipe.nr_racione || '',
        eshte_aprovuar: recipe.eshte_aprovuar || false,
        ingredients: prev.ingredients // Keep existing ingredients
      }));
    }
  }, [recipe]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await fetchAvailableIngredients();
        if (recipe) {
          // await fetchRecipeIngredients();
          await Promise.all([
            fetchRecipeIngredients(),
            fetchRecipeSteps()
          ]);
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [recipe]);

  useEffect(() => {
    fetchAvailableIngredients();
    if (recipe) {
      fetchRecipeIngredients();
    }
  }, [recipe]);

  useEffect(() => {
    const fetchAvailableCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/recipes/filter-options');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setAvailableCategories(data.categories);
      } catch (error) {
        console.error('Error fetching available categories:', error);
      }
    };

    const fetchRecipeCategories = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/recipes/${recipe.receta_id}/categories`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch recipe categories');
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          categories: data.map(cat => ({
            kategoria_id: cat.kategoria_id,
            emri: cat.emri
          }))
        }));
      } catch (error) {
        console.error('Error fetching recipe categories:', error);
      }
    };

    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchAvailableCategories(),
          fetchAvailableIngredients(),
          recipe && fetchRecipeIngredients(),
          recipe && fetchRecipeSteps(),
          recipe && fetchRecipeCategories()
        ]);
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [recipe])

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Form data before sending:', formData);

    const formDataToSend = new FormData();
  
    // Add basic recipe data
    formDataToSend.append('titulli', formData.titulli);
    formDataToSend.append('pershkrimi', formData.pershkrimi);
    formDataToSend.append('koha_pergatitja', formData.koha_pergatitja);
    formDataToSend.append('koha_gatimi', formData.koha_gatimi);
    formDataToSend.append('nr_racione', formData.nr_racione);
    formDataToSend.append('eshte_aprovuar', formData.eshte_aprovuar);
    formDataToSend.append('ingredients', JSON.stringify(formData.ingredients.map(ing => ({
      perberesi_id: ing.perberesi_id,
      sasia: ing.sasia,
      njesia: ing.njesia
    }))));
    formDataToSend.append('steps', JSON.stringify(formData.steps));
    formDataToSend.append('categories', JSON.stringify(formData.categories));

  
    // Add new image if selected
    if (selectedImage) {
      formDataToSend.append('recipe_image', selectedImage);
    }

    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }
  
    onSave(formDataToSend);
  };

  const fetchAvailableIngredients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/ingredients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch ingredients');
      const data = await response.json();
      setAvailableIngredients(data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    }
  };

  const fetchRecipeIngredients = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${recipe.receta_id}/ingredients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch recipe ingredients');
      const data = await response.json();
      console.log('Fetched ingredients:', data); // Debug log

      setFormData(prev => ({
        ...prev,
        titulli: recipe.titulli,
        pershkrimi: recipe.pershkrimi,
        koha_pergatitja: recipe.koha_pergatitja,
        koha_gatimi: recipe.koha_gatimi,
        nr_racione: recipe.nr_racione,
        eshte_aprovuar: recipe.eshte_aprovuar,
        // ingredients: data
        ingredients: data.map(ing => ({
          perberesi_id: ing.perberesi_id,
          sasia: ing.sasia,
          njesia: ing.njesia,
          emri: ing.emri
        }))
      }));
    } catch (err) {
      console.error('Error fetching recipe ingredients:', err);
    }
  };

  // Add function to fetch recipe steps
  const fetchRecipeSteps = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${recipe.receta_id}/steps`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch recipe steps');
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        steps: data.sort((a, b) => a.nr_hapi - b.nr_hapi)
      }));
    } catch (err) {
      console.error('Error fetching recipe steps:', err);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      ingredients: updatedIngredients
    }));
  }; 

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { perberesi_id: '', sasia: '', njesia: '' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Add this function to handle adding new ingredient
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

      if (!response.ok) throw new Error('Failed to add new ingredient');
      
      const data = await response.json();
      
      // Add the new ingredient to availableIngredients
      setAvailableIngredients(prev => [...prev, data]);

      // Add the new ingredient to the recipe's ingredients while preserving existing ones
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, {
          perberesi_id: data.perberesi_id,
          sasia: '',
          njesia: data.njesia,
          emri: data.emri
        }]
      }));
      
      // Add the new ingredient to the recipe's ingredients
      handleIngredientChange(formData.ingredients.length, 'perberesi_id', data.perberesi_id);
      handleIngredientChange(formData.ingredients.length, 'njesia', data.njesia);
      
      // Reset form
      setNewIngredient({ name: '', unit: '' });
      setShowNewIngredientForm(false);
      
      // Refresh available ingredients
      await fetchAvailableIngredients();
    } catch (error) {
      console.error('Error adding new ingredient:', error);
    }
  };

  // Add function to handle step changes
  const handleStepChange = (index, field, value) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = {
        ...newSteps[index],
        [field]: value
      };
      return {
        ...prev,
        steps: newSteps
      };
    });
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
      
      // Add to available categories
      setAvailableCategories(prev => [...prev, data]);
      
      // Add to form data
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, {
          kategoria_id: data.kategoria_id,
          emri: data.emri
        }]
      }));
      
      // Reset form
      setNewCategory({ name: '', description: '' });
      setShowNewCategoryForm(false);
    } catch (error) {
      console.error('Error adding new category:', error);
    }
  };

  // Add function to add new step
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        nr_hapi: prev.steps.length + 1,
        pershkrimi: ''
      }]
    }));
  };

  // Add function to remove step
  const removeStep = (index) => {
    setFormData(prev => {
      const newSteps = prev.steps.filter((_, i) => i !== index)
        .map((step, i) => ({
          ...step,
          nr_hapi: i + 1
        }));
      return {
        ...prev,
        steps: newSteps
      };
    });
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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Modifiko Recetën</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className="loading">Duke u ngarkuar...</div>
        ) : (

        <form onSubmit={handleSubmit} className="edit-recipe-form">
          <div className="form-group">
            <label>Titulli</label>
            <input
              type="text"
              name="titulli"
              value={formData.titulli}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Imazhi aktual</label>
              <div className="image-preview-container">

              {recipe.url_media && !imagePreview && (
                <img 
                  src={getImageUrl(recipe)}
                  alt="Imazhi aktual"
                  className="current-image-preview"
                />
              )}
              {imagePreview && (
                <img 
                  src={imagePreview}
                  alt="Imazhi i ri"
                  className="new-image-preview"
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreview && (
              <button 
                type="button" 
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="remove-image-btn"
              >
                Hiq imazhin e ri
              </button>
            )}
          </div>

          <div className="form-group">
            <label>Përshkrimi</label>
            <textarea
              name="pershkrimi"
              value={formData.pershkrimi}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-section">
            <h2>Kategoria</h2>
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

          <div className="ingredients-section">
            <h3>Përbërësit</h3>
            <div className="ingredients-header">
              <button type="button" onClick={addIngredient} className="add-ingredient-btn">
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
                  value={ingredient.perberesi_id || ''}
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
                  value={ingredient.sasia || ''}
                  onChange={(e) => handleIngredientChange(index, 'sasia', e.target.value)}
                  placeholder="Sasia"
                  required
                />
                
                <input
                  type="text"
                  value={ingredient.njesia || ''}
                  onChange={(e) => handleIngredientChange(index, 'njesia', e.target.value)}
                  placeholder="Njësia matëse"
                  required
                />
                
                <button 
                  type="button" 
                  onClick={() => removeIngredient(index)}
                  className="remove-ingredient-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="steps-section">
            <h3>Hapat e Përgatitjes</h3>
            <button 
              type="button" 
              onClick={addStep} 
              className="add-step-btn"
            >
              Shto hap
            </button>
            
            {formData.steps.map((step, index) => (
              <div key={index} className="step-row">
                <div className="step-number">
                  Hapi {step.nr_hapi}
                </div>
                <div className="step-inputs">
                  <textarea
                    value={step.pershkrimi || ''}
                    onChange={(e) => handleStepChange(index, 'pershkrimi', e.target.value)}
                    placeholder="Përshkrimi i hapit"
                    className="step-description"
                    required
                  />
                  
                </div>
                <button 
                  type="button" 
                  onClick={() => removeStep(index)}
                  className="remove-step-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>


          <div className="form-group">
            <label>Koha e Përgatitjes (minuta)</label>
            <input
              type="number"
              name="koha_pergatitja"
              value={formData.koha_pergatitja}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Koha e Gatimit (minuta)</label>
            <input
              type="number"
              name="koha_gatimi"
              value={formData.koha_gatimi}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Numri i Racioneve</label>
            <input
              type="number"
              name="nr_racione"
              value={formData.nr_racione}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="eshte_aprovuar"
                checked={formData.eshte_aprovuar}
                onChange={handleChange}
              />
              Aprovo
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Anulo
            </button>
            <button type="submit" className="save-button">
              Ruaj Modifikimet
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default EditRecipeModal;