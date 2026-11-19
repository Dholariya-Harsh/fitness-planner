import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';

const WorkoutHistoryPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workoutApi.getWorkoutLogs();
      // Handle both DRF PageNumberPagination and standard array responses
      const logData = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      
      setLogs(logData);
    } catch (err) {
        console.error("Full Axios Error Object:", err);
        if (err.response) {
            // Response received with status code outside 2xx range
            setError(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        } else if (err.request) {
            // Request was made but no response was received (CORS / Server down)
            setError('Network Error: Server did not respond. Check CORS settings or backend server state.');
        } else {
            // Something happened in setting up the request
            setError(`Request Error: ${err.message}`);
        }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex flex-col items-center text-center">
        <div className="spinner" role="status" />
        <p className="mt-3 text-sm text-zinc-400">Loading workout history...</p>
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Workout history</h1>
        <button type="button" className="btn-ghost" onClick={() => navigate('/workout')}>
          Back to tracker
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {logs.length === 0 && !error ? (
        <div className="card text-center">
          <h2 className="text-xl font-semibold">No workouts logged</h2>
          <p className="mt-2 text-zinc-400">Your completed sessions will show up here.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate('/workout')}>
            Log today’s workout
          </button>
        </div>
      ) : (
        logs.map((log) => (
          <article key={log.id} className="card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-sky-300">{log.date}</h2>
                {log.workout_split_name && (
                  <p className="text-sm text-zinc-400">Split: {log.workout_split_name}</p>
                )}
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Completed
              </span>
            </div>
            <div className="p-5">
              {log.notes && (
                <p className="mb-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400">
                  <span className="font-semibold text-zinc-200">Notes: </span>
                  {log.notes}
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="pb-2">Exercise</th>
                      <th className="pb-2">Weight</th>
                      <th className="pb-2">Reps</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.logged_sets && log.logged_sets.length > 0 ? (
                      log.logged_sets.map((set, idx) => (
                        <tr key={set.id || idx} className="border-t border-white/10">
                          <td className="py-2 font-semibold">{set.exercise_name || `Set ${idx + 1}`}</td>
                          <td className="py-2">{set.actual_weight} kg</td>
                          <td className="py-2">{set.actual_reps} reps</td>
                          <td className="py-2">
                            {set.completed ? (
                              <span className="font-semibold text-emerald-300">Completed</span>
                            ) : (
                              <span className="text-zinc-500">Incomplete</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-zinc-500">No sets recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
};

export default WorkoutHistoryPage;  