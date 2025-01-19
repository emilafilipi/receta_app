import { useState, useEffect } from 'react';
import '../styles/IngredientFilterModal.css';

function IngredientFilterModal({ isOpen, onClose, onApplyFilter, currentIngredients = [] }) {
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [strictMatch, setStrictMatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    setSelectedIngredients(currentIngredients);
  }, [currentIngredients]);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes/ingredients');
      if (!response.ok) throw new Error('Failed to fetch ingredients');
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleCheckboxChange = (ingredientId) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      } else {
        return [...prev, ingredientId];
      }
    });
  };

  const handleApply = () => {
    onApplyFilter({
      ingredients: selectedIngredients,
      strictMatch: strictMatch
    });
    onClose();
  };

  const handleCancel = () => {
    // Clear all selections
    setSelectedIngredients([]);
    setStrictMatch(false);
    setSearchTerm('');
    // Apply empty filter to clear existing filters
    onApplyFilter({
      ingredients: [],
      strictMatch: false
    });
    onClose();
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.emri.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Filtro siper përbërësve</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="search-section">
            <input
              type="text"
              placeholder="Kërko përbërës..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ingredient-search"
            />
          </div>

          <div className="match-type-section">
            <label className="match-type-label">
              <input
                type="checkbox"
                checked={strictMatch}
                onChange={(e) => setStrictMatch(e.target.checked)}
              />
              Kërkim ekzakt (shfaqen receta që përmbajnë vetëm përbërësit e përzgjedhur)
            </label>
          </div>

          <div className="ingredients-list">
            {filteredIngredients.map(ingredient => (
              <div key={ingredient.perberesi_id} className="ingredient-checkbox-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIngredients.includes(ingredient.perberesi_id)}
                    onChange={() => handleCheckboxChange(ingredient.perberesi_id)}
                  />
                  {ingredient.emri}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={handleCancel}
          >
            Hiq përzgjedhjet
          </button>
          <button 
            className="apply-button"
            onClick={handleApply}
            disabled={selectedIngredients.length === 0}
          >
            Apliko përzgjedhjet ({selectedIngredients.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}

export default IngredientFilterModal;