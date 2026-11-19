import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi';

const AddMeal = () => {
  const navigate = useNavigate();

  const [mealName, setMealName] = useState('');
  const [availableFoods, setAvailableFoods] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Array of { food_item_id, food_item, amount_grams }
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserIngredients();
  }, []);

  const loadUserIngredients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await nutritionApi.getFoodItems();
      const rawItems = response.data.results ? response.data.results : response.data;
      const items = Array.isArray(rawItems) ? rawItems : [];
      
      items.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableFoods(items);
    } catch (err) {
      console.error(err);
      setError('Could not fetch ingredients library.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = (foodItem) => {
    if (selectedIngredients.some((item) => item.food_item_id === foodItem.id)) {
      return; 
    }
    setSelectedIngredients((prev) => [
      ...prev,
      {
        food_item_id: foodItem.id,
        food_item: foodItem,
        amount_grams: 100, // Default start amount 100g
      },
    ]);
  };

  const handleAmountChange = (foodId, grams) => {
    const parsed = Math.max(0, parseFloat(grams) || 0);
    setSelectedIngredients((prev) =>
      prev.map((item) =>
        item.food_item_id === foodId ? { ...item, amount_grams: parsed } : item
      )
    );
  };

  const handleRemoveIngredient = (foodId) => {
    setSelectedIngredients((prev) => prev.filter((item) => item.food_item_id !== foodId));
  };

  // Live total macros calculation from selected items
  const mealTotals = useMemo(() => {
    return selectedIngredients.reduce(
      (acc, item) => {
        const grams = item.amount_grams;
        const fi = item.food_item;
        return {
          calories: acc.calories + (parseFloat(fi.calories) || 0) * grams,
          protein: acc.protein + (parseFloat(fi.protein) || 0) * grams,
          carbs: acc.carbs + (parseFloat(fi.carbs) || 0) * grams,
          fat: acc.fat + (parseFloat(fi.fat) || 0) * grams,
          fiber: acc.fiber + (parseFloat(fi.fiber) || 0) * grams,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [selectedIngredients]);

  const handleSubmitMeal = async (e) => {
    e.preventDefault();
    if (!mealName.trim()) {
      setError('Meal name is required.');
      return;
    }
    if (selectedIngredients.length === 0) {
      setError('Please add at least one ingredient to build a meal.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Format clean numeric values
    const payload = {
      name: mealName.trim(),
      calories: Number(mealTotals.calories.toFixed(2)),
      protein: Number(mealTotals.protein.toFixed(2)),
      carbs: Number(mealTotals.carbs.toFixed(2)),
      fat: Number(mealTotals.fat.toFixed(2)),
      fiber: Number(mealTotals.fiber.toFixed(2)),
      ingredients: selectedIngredients.map((item) => ({
        food_item: item.food_item_id,
        food_item_id: item.food_item_id,
        amount_grams: Number(item.amount_grams),
      })),
    };

    try {
      await nutritionApi.createMeal(payload);
      navigate('/nutrition');
    } catch (err) {
      console.error('Meal creation error:', err.response?.data);
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (typeof backendErrors === 'object') {
          // Extracts specific Django validation error fields (e.g. "name: This field is required.")
          const formattedErr = Object.entries(backendErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          setError(formattedErr);
        } else {
          setError('Validation failed on server.');
        }
      } else {
        setError('Failed to create composite meal.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSearchFoods = useMemo(() => {
    if (!searchQuery.trim()) return availableFoods;
    return availableFoods.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableFoods, searchQuery]);

  const totals = [
    ['Calories', mealTotals.calories.toFixed(1), 'text-emerald-400'],
    ['Protein', `${mealTotals.protein.toFixed(1)}g`, 'text-sky-300'],
    ['Carbs', `${mealTotals.carbs.toFixed(1)}g`, 'text-amber-300'],
    ['Fat', `${mealTotals.fat.toFixed(1)}g`, 'text-rose-300'],
    ['Fiber', `${mealTotals.fiber.toFixed(1)}g`, 'text-violet-300'],
  ];

  return (
    <div className="page">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/nutrition')}>
        Back to nutrition
      </button>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h1 className="mb-4 text-2xl font-bold text-emerald-400">Build a meal</h1>
          {error && <div className="alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmitMeal} className="space-y-4">
            <div>
              <label className="label">Meal title</label>
              <input
                type="text"
                className="field"
                placeholder="Chicken rice bowl"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required
              />
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-300">Selected ingredients</h2>
            {selectedIngredients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-zinc-400">
                Search the library and add ingredients.
              </p>
            ) : (
              selectedIngredients.map((item) => (
                <div key={item.food_item_id} className="grid items-center gap-3 rounded-xl border border-white/10 p-3 md:grid-cols-6">
                  <div className="md:col-span-3">
                    <p className="font-semibold">{item.food_item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {((parseFloat(item.food_item.calories) || 0) * 100).toFixed(0)} kcal / 100{item.food_item.serving_unit || 'g'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="field"
                      value={item.amount_grams}
                      onChange={(e) => handleAmountChange(item.food_item_id, e.target.value)}
                    />
                    <span className="text-xs text-zinc-500">{item.food_item.serving_unit || 'g'}</span>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => handleRemoveIngredient(item.food_item_id)}>
                    Remove
                  </button>
                </div>
              ))
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
              {submitting ? 'Saving meal...' : 'Save meal'}
            </button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card border-sky-400/30">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">Live totals</h2>
            <div className="grid grid-cols-3 gap-3">
              {totals.map(([label, value, tone]) => (
                <div key={label}>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
                  <p className={`text-lg font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">Ingredient library</h2>
            <input
              type="text"
              className="field mb-3"
              placeholder="Search ingredients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {loading ? (
                <p className="text-center text-sm text-zinc-400">Loading ingredients...</p>
              ) : filteredSearchFoods.length === 0 ? (
                <p className="text-center text-sm text-zinc-400">No ingredients found.</p>
              ) : (
                filteredSearchFoods.map((food) => {
                  const isAdded = selectedIngredients.some((item) => item.food_item_id === food.id);
                  return (
                    <div key={food.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                      <div>
                        <p className="font-semibold">{food.name}</p>
                        <p className="text-xs text-zinc-500">
                          {((parseFloat(food.calories) || 0) * 100).toFixed(0)} kcal / 100{food.serving_unit || 'g'}
                        </p>
                      </div>
                      <button type="button" className={isAdded ? 'btn-ghost' : 'btn-primary'} onClick={() => handleAddIngredient(food)} disabled={isAdded}>
                        {isAdded ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMeal;