import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi';

const AddIngredient = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    serving_unit: 'g',
    calories100: '',
    protein100: '',
    carbs100: '',
    fat100: '',
    fiber100: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Ingredient name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Convert values per 100g to per 1g values stored in Django
    const payload = {
      name: formData.name.trim(),
      serving_unit: formData.serving_unit,
      calories: (parseFloat(formData.calories100) || 0) / 100,
      protein: (parseFloat(formData.protein100) || 0) / 100,
      carbs: (parseFloat(formData.carbs100) || 0) / 100,
      fat: (parseFloat(formData.fat100) || 0) / 100,
      fiber: (parseFloat(formData.fiber100) || 0) / 100,
    };

    try {
      await nutritionApi.createFoodItem(payload);
      navigate('/nutrition');
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          const firstVal = errorData[firstKey];
          setError(`${firstKey}: ${Array.isArray(firstVal) ? firstVal[0] : firstVal}`);
        } else {
          setError('Validation failed.');
        }
      } else {
        setError('Failed to create ingredient.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const unit = formData.serving_unit;
  const macroFields = [
    ['calories100', `Calories per 100${unit}`, '389', true],
    ['protein100', `Protein (g per 100${unit})`, '16.9', false],
    ['carbs100', `Carbs (g per 100${unit})`, '66.3', false],
    ['fat100', `Fat (g per 100${unit})`, '6.9', false],
    ['fiber100', `Fiber (g per 100${unit})`, '10.6', false],
  ];

  return (
    <div className="page-narrow">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/nutrition')}>
        Back to nutrition
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-emerald-400">Add ingredient</h1>
        <p className="mb-5 text-sm text-zinc-400">Enter nutrition per 100g or 100ml.</p>
        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ingredient name</label>
            <input type="text" name="name" className="field" placeholder="Rolled oats, chicken breast" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Serving unit</label>
            <select name="serving_unit" className="field" value={formData.serving_unit} onChange={handleChange}>
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {macroFields.map(([name, label, placeholder, required]) => (
              <div key={name} className={name === 'fiber100' ? 'sm:col-span-2' : ''}>
                <label className="label">{label}</label>
                <input type="number" step="0.1" min="0" name={name} className="field" placeholder={placeholder} value={formData[name]} onChange={handleChange} required={required} />
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
            {submitting ? 'Saving ingredient...' : 'Save ingredient'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddIngredient;