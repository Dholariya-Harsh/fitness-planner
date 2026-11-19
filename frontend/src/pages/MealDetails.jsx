import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi';

const MealDetails = () => {
  const { mealId } = useParams();
  const navigate = useNavigate();

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMealDetails();
  }, [mealId]);

  const fetchMealDetails = async () => {
    setLoading(true);
    try {
      const response = await nutritionApi.getMeal(mealId);
      setMeal(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not load meal details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex justify-center">
        <div className="spinner" role="status" />
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="page">
        <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/nutrition')}>
          Back to nutrition
        </button>
        <div className="alert-error">{error || 'Meal not found.'}</div>
      </div>
    );
  }

  const macros = [
    ['Calories', meal.calories.toFixed(1), 'text-emerald-400'],
    ['Protein', `${meal.protein.toFixed(1)}g`, 'text-sky-300'],
    ['Carbs', `${meal.carbs.toFixed(1)}g`, 'text-amber-300'],
    ['Fat', `${meal.fat.toFixed(1)}g`, 'text-rose-300'],
    ['Fiber', `${meal.fiber.toFixed(1)}g`, 'text-violet-300'],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/nutrition')}>
        Back to nutrition
      </button>

      <div className="card">
        <h1 className="mb-5 text-3xl font-bold text-emerald-400">{meal.name}</h1>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {macros.map(([label, value, tone]) => (
            <div key={label} className="stat">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
              <p className={`text-xl font-bold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">Ingredients</h2>
        {meal.ingredients?.length === 0 ? (
          <p className="text-zinc-400">No ingredients linked to this meal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-2">Ingredient</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Calories</th>
                </tr>
              </thead>
              <tbody>
                {meal.ingredients.map((ing, idx) => {
                  const food = ing.food_item_detail || {};
                  const grams = ing.amount_grams;
                  const itemCals = (food.calories || 0) * grams;
                  return (
                    <tr key={idx} className="border-t border-white/10">
                      <td className="py-3 font-semibold">{ing.food_item_name || food.name || 'Ingredient'}</td>
                      <td className="py-3 text-zinc-300">{grams} {food.serving_unit || 'g'}</td>
                      <td className="py-3 text-emerald-300">{itemCals.toFixed(1)} kcal</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealDetails;