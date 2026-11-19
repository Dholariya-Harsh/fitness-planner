import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';
import ProgressBar from '../components/ProgressBar';

// Helper Sub-component for Set Input Rows
const canMarkDone = (weight, reps) => {
  const weightText = String(weight ?? '').trim();
  const repsText = String(reps ?? '').trim();
  if (weightText === '' || repsText === '') return false;
  const weightNumber = Number(weightText);
  const repsNumber = Number(repsText);
  return !Number.isNaN(weightNumber) && weightNumber >= 0 && !Number.isNaN(repsNumber) && repsNumber > 0;
};

const SetInputRow = ({ setNumber, targetReps, setData, onChange }) => {
  const canComplete = canMarkDone(setData.weight, setData.reps);

  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <div className="col-span-2 text-center text-sm font-semibold text-sky-300">#{setNumber}</div>
      <div className="col-span-4">
        <input
          type="number"
          step="0.5"
          min="0"
          className="field py-1.5 text-center"
          placeholder="0"
          value={setData.weight}
          onChange={(e) => onChange(setNumber, 'weight', e.target.value)}
        />
      </div>
      <div className="col-span-4">
        <input
          type="number"
          min="0"
          className="field py-1.5 text-center"
          placeholder={`Target ${targetReps}`}
          value={setData.reps}
          onChange={(e) => onChange(setNumber, 'reps', e.target.value)}
        />
      </div>
      <div className="col-span-2 text-center">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-white/20 bg-zinc-950 text-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
          checked={Boolean(setData.completed) && canComplete}
          disabled={!canComplete}
          title={canComplete ? 'Mark this set done' : 'Enter weight and reps first'}
          onChange={(e) => onChange(setNumber, 'completed', e.target.checked)}
        />
      </div>
    </div>
  );
};

const WorkoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [activeSplit, setActiveSplit] = useState(null);
  const [todayWorkoutDay, setTodayWorkoutDay] = useState(null);
  const [logFormData, setLogFormData] = useState({}); // { [workout_exercise_id]: { [set_number]: { weight, reps, completed } } }
  const [notes, setNotes] = useState('');
  const [savedLogs, setSavedLogs] = useState([]);

  // Calculate today's day number (1 = Monday, ..., 7 = Sunday)
  const currentDayIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, []);

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadActiveWorkout();
  }, [currentDayIndex]);

  const loadActiveWorkout = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workoutApi.getSplits();
      const splits = response.data.results || response.data;
      const active = splits.find((s) => s.is_active);

      if (active) {
        setActiveSplit(active);
        const dayMatch = active.days?.find((d) => d.day_number === currentDayIndex);
        setTodayWorkoutDay(dayMatch || null);

        if (dayMatch && !dayMatch.is_rest_day) {
          const todayDate = new Date().toISOString().split('T')[0];
          const logsResponse = await workoutApi.getWorkoutLogs({ workout_day: dayMatch.id });
          const logs = logsResponse.data.results || logsResponse.data || [];
          setSavedLogs(Array.isArray(logs) ? logs : []);

          const todayLog = (Array.isArray(logs) ? logs : []).find((log) => log.date === todayDate);
          if (todayLog) {
            setNotes(todayLog.notes || '');
            const plannedById = Object.fromEntries(
              (dayMatch.planned_exercises || []).map((planned) => [planned.id, planned])
            );
            const hydrated = {};
            (todayLog.logged_sets || []).forEach((set) => {
              const planned = plannedById[set.workout_exercise];
              if (!planned) return;
              const weight = set.actual_weight ?? '';
              const reps = set.actual_reps ?? '';
              hydrated[planned.id] = {
                ...hydrated[planned.id],
                [planned.set_number]: {
                  weight: weight === null ? '' : String(weight),
                  reps: reps === null ? '' : String(reps),
                  completed: Boolean(set.completed) && canMarkDone(weight, reps),
                },
              };
            });
            setLogFormData(hydrated);
          } else {
            setNotes('');
            setLogFormData({});
          }
        } else {
          setSavedLogs([]);
          setNotes('');
          setLogFormData({});
        }
      } else {
        setActiveSplit(null);
        setTodayWorkoutDay(null);
        setSavedLogs([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch workout plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group planned exercises by exercise instance ID
  const groupedExercises = useMemo(() => {
    if (!todayWorkoutDay || todayWorkoutDay.is_rest_day) return [];

    const map = {};
    todayWorkoutDay.planned_exercises?.forEach((pe) => {
      const exId = pe.exercise_detail?.id || pe.exercise;
      if (!map[exId]) {
        map[exId] = {
          exerciseName: pe.exercise_detail?.name || 'Exercise',
          category: pe.exercise_detail?.category || 'General',
          sets: [],
        };
      }
      map[exId].sets.push(pe);
    });

    return Object.values(map);
  }, [todayWorkoutDay]);

  // Aggregate set metrics for performance tracking
  const totalPlannedSets = useMemo(() => {
    return todayWorkoutDay?.planned_exercises?.length || 0;
  }, [todayWorkoutDay]);

  const completedSetsCount = useMemo(() => {
    let count = 0;
    Object.values(logFormData).forEach((exerciseSets) => {
      Object.values(exerciseSets).forEach((setData) => {
        if (setData.completed && canMarkDone(setData.weight, setData.reps)) {
          count++;
        }
      });
    });
    return count;
  }, [logFormData]);

  const handleSetChange = (workoutExerciseId, setNum, field, val) => {
    setLogFormData((prev) => {
      const current = {
        ...(prev[workoutExerciseId]?.[setNum] || { weight: '', reps: '', completed: false }),
        [field]: val,
      };
      const canComplete = canMarkDone(current.weight, current.reps);
      if (!canComplete) current.completed = false;

      return {
        ...prev,
        [workoutExerciseId]: {
          ...prev[workoutExerciseId],
          [setNum]: current,
        },
      };
    });
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    if (!todayWorkoutDay) return;

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const todayDate = new Date().toISOString().split('T')[0];

      // Format payload structure expected by WorkoutLogSerializer
      const logged_sets = [];
      todayWorkoutDay.planned_exercises.forEach((pe) => {
        const setData = logFormData[pe.id]?.[pe.set_number];
        if (setData && (String(setData.weight ?? '').trim() !== '' || String(setData.reps ?? '').trim() !== '')) {
          const complete = canMarkDone(setData.weight, setData.reps) && Boolean(setData.completed);
          logged_sets.push({
            workout_exercise: pe.id,
            actual_weight: String(setData.weight ?? '').trim() === '' ? 0.0 : parseFloat(setData.weight),
            actual_reps: String(setData.reps ?? '').trim() === '' ? 0 : parseInt(setData.reps, 10),
            completed: complete,
          });
        }
      });

      const payload = {
        workout_day: todayWorkoutDay.id,
        workout_split: activeSplit.id,
        date: todayDate,
        notes,
        logged_sets,
      };

      await workoutApi.createWorkoutLog(payload);
      const logsResponse = await workoutApi.getWorkoutLogs({ workout_day: todayWorkoutDay.id });
      const logs = logsResponse.data.results || logsResponse.data || [];
      setSavedLogs(Array.isArray(logs) ? logs : []);
      setSuccessMsg('Workout logged. Saved sets are shown below.');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const errorDetail = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
        setError(errorDetail || 'Error saving workout log.');
      } else {
        setError('Error completing workout log action.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex flex-col items-center text-center">
        <div className="spinner" role="status" />
        <p className="mt-3 text-sm text-zinc-400">Loading today’s session...</p>
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">{dayNames[currentDayIndex]}</p>
          <h1 className="text-3xl font-bold">Daily workout</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate('/workout/history')}>
            History
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/workout/splits')}>
            Manage splits
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successMsg && <div className="alert-ok">{successMsg}</div>}

      {!activeSplit && (
        <div className="card text-center">
          <h2 className="text-xl font-semibold">No active split</h2>
          <p className="mt-2 text-zinc-400">Create or activate a weekly split to start logging.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate('/workout/splits')}>
            Set up a split
          </button>
        </div>
      )}

      {activeSplit && todayWorkoutDay?.is_rest_day && (
        <div className="card border-sky-400/30 text-center">
          <h2 className="text-3xl font-bold">Rest day</h2>
          <p className="mt-2 text-zinc-400">Recover today. The next session is already on the plan.</p>
        </div>
      )}

      {activeSplit && todayWorkoutDay && !todayWorkoutDay.is_rest_day && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-semibold text-sky-300">{todayWorkoutDay.title}</h2>
            <p className="mb-4 text-sm text-zinc-400">
              {activeSplit.name} · {groupedExercises.length} exercises
            </p>
            <ProgressBar completed={completedSetsCount} total={totalPlannedSets} />
          </div>

          <form onSubmit={handleLogWorkout} className="space-y-4">
            {groupedExercises.map((group, idx) => (
              <div key={idx} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <h3 className="font-semibold text-sky-300">{group.exerciseName}</h3>
                  <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-semibold uppercase text-sky-200">
                    {group.category}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="grid grid-cols-12 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4">Weight</div>
                    <div className="col-span-4">Reps</div>
                    <div className="col-span-2">Done</div>
                  </div>
                  {group.sets.map((setObj) => (
                    <SetInputRow
                      key={setObj.id}
                      setNumber={setObj.set_number}
                      targetReps={setObj.target_reps}
                      setData={logFormData[setObj.id]?.[setObj.set_number] || { weight: '', reps: '', completed: false }}
                      onChange={(setNum, field, val) => handleSetChange(setObj.id, setNum, field, val)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="card">
              <label className="label">Session notes</label>
              <textarea
                className="field"
                rows="2"
                placeholder="How did this workout feel?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? 'Logging workout...' : 'Log workout'}
            </button>
          </form>

          <div className="card">
            <h2 className="text-lg font-semibold">Saved history</h2>
            <p className="mb-4 text-sm text-zinc-400">Sessions logged for this workout day.</p>
            {savedLogs.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing saved yet. Mark sets done after entering weight and reps.</p>
            ) : (
              <div className="space-y-4">
                {savedLogs.map((log) => (
                  <article key={log.id} className="rounded-xl border border-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-sky-300">{log.date}</h3>
                      <span className="text-xs text-zinc-500">
                        {(log.logged_sets || []).filter((set) => set.completed).length} done
                      </span>
                    </div>
                    {log.notes && <p className="mb-3 text-sm text-zinc-400">{log.notes}</p>}
                    {(log.logged_sets || []).length === 0 ? (
                      <p className="text-sm text-zinc-500">No sets recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="pb-2">Exercise</th>
                              <th className="pb-2">Weight</th>
                              <th className="pb-2">Reps</th>
                              <th className="pb-2">Done</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.logged_sets.map((set, index) => (
                              <tr key={set.id || index} className="border-t border-white/10">
                                <td className="py-2">{set.exercise_name || 'Exercise'}</td>
                                <td className="py-2">{set.actual_weight} kg</td>
                                <td className="py-2">{set.actual_reps}</td>
                                <td className="py-2">{set.completed ? 'Yes' : 'No'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPage;