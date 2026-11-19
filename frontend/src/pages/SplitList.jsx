import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';
import SplitCard from '../components/SplitCard';

const SplitList = () => {
  const navigate = useNavigate();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSplits();
  }, []);

  const fetchSplits = async () => {
    setLoading(true);
    try {
      const response = await workoutApi.getSplits();
      setSplits(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      setError('Could not load splits.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await workoutApi.activateSplit(id);
      fetchSplits();
    } catch (err) {
      console.error(err);
      setError('Failed to activate split.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this split?')) return;
    try {
      await workoutApi.deleteSplit(id);
      setSplits(splits.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete split.');
    }
  };

  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" className="btn-ghost mb-3" onClick={() => navigate('/workout')}>
            Back to today’s workout
          </button>
          <h1 className="text-3xl font-bold">Workout splits</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate('/exercises/new')}>
            Add exercise
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate('/workout/splits/create')}>
            Create split
          </button>
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="spinner" role="status" />
        </div>
      ) : splits.length === 0 ? (
        <div className="card text-center">
          <p className="text-zinc-400">No splits created yet.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate('/workout/splits/create')}>
            Create your first split
          </button>
        </div>
      ) : (
        splits.map((split) => (
          <SplitCard
            key={split.id}
            split={split}
            onActivate={handleActivate}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
};

export default SplitList;