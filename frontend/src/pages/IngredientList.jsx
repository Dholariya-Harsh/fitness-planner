import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi';

const IngredientList = () => {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await nutritionApi.getFoodItems();
      const list = response.data.results || response.data;
      list.sort((a, b) => a.name.localeCompare(b.name));
      setIngredients(list);
    } catch (err) {
      console.error(err);
      setError('Could not load ingredients.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ingredient? Note: This may impact recipes using it.')) return;
    try {
      await nutritionApi.deleteFoodItem(id);
      setIngredients(ingredients.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete ingredient.');
    }
  };

  const filtered = ingredients.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" className="btn-ghost mb-3" onClick={() => navigate('/nutrition')}>
            Back to nutrition
          </button>
          <h1 className="text-3xl font-bold">Ingredient library</h1>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/nutrition/add-ingredient')}>
          Add ingredient
        </button>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <input
        type="text"
        className="field mb-4"
        placeholder="Filter ingredients"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="spinner" role="status" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-zinc-400">No ingredients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">kcal / 100</th>
                  <th className="px-4 py-3">Protein</th>
                  <th className="px-4 py-3">Carbs</th>
                  <th className="px-4 py-3">Fat</th>
                  <th className="px-4 py-3">Fiber</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold">{item.name}</td>
                    <td className="px-4 py-3">{(item.calories * 100).toFixed(1)}</td>
                    <td className="px-4 py-3 text-sky-300">{(item.protein * 100).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-amber-300">{(item.carbs * 100).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-rose-300">{(item.fat * 100).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-violet-300">{(item.fiber * 100).toFixed(1)}g</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientList;