import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';

const CreateSplit = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Split name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // POST creating split triggers automatic creation of 7 WorkoutDays in Backend
      const response = await workoutApi.createSplit({
        name: name.trim(),
        is_active: isActive,
      });

      const createdSplit = response.data;
      navigate(`/workout/split/${createdSplit.id}/edit`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data?.name) {
        setError(err.response.data.name[0]);
      } else {
        setError('Failed to create split.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/workout/splits')}>
        Cancel
      </button>

      <div className="card">
        <h1 className="mb-4 text-2xl font-bold text-sky-300">Create workout split</h1>
        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Split name</label>
            <input
              type="text"
              className="field"
              placeholder="Push pull legs, upper lower..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-zinc-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-zinc-950 text-emerald-400 focus:ring-emerald-400"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Set as the active weekly split
          </label>

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Creating split...' : 'Save and configure days'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSplit;