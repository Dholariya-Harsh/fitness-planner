import React, { useState, useEffect } from 'react';
import { workoutApi } from '../api/workoutApi';

const ExerciseSearch = ({ onSelectExercise, existingExerciseIds = [] }) => {
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const response = await workoutApi.getExercises({ search: query });
        const list = response.data.results || response.data;
        setExercises(list);
      } catch (err) {
        console.error('Failed to load exercise library:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchExercises();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative mb-3">
      <label className="label">Search exercise to add</label>
      <input
        type="text"
        className="field"
        placeholder="Type a name, e.g. Bench Press"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="mt-1 text-xs text-zinc-500">Searching library...</p>}

      {query.length > 0 && exercises.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
          {exercises.map((ex) => {
            const isAdded = existingExerciseIds.includes(ex.id);
            return (
              <li key={ex.id}>
                <button
                  type="button"
                  disabled={isAdded}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5 ${
                    isAdded ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  onClick={() => {
                    if (!isAdded) {
                      onSelectExercise(ex);
                      setQuery('');
                    }
                  }}
                >
                  <span>
                    <strong>{ex.name}</strong>{' '}
                    <span className="text-zinc-500">({ex.category})</span>
                  </span>
                  <span className={isAdded ? 'text-xs text-amber-300' : 'text-xs font-semibold text-emerald-300'}>
                    {isAdded ? 'Added' : '+ Add'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ExerciseSearch;
