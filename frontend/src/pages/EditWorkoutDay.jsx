import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';
import ExerciseSearch from '../components/ExerciseSearch';

const EditWorkoutDay = () => {
  const { splitId } = useParams();
  const navigate = useNavigate();

  const [split, setSplit] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [currentDayData, setCurrentDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSplitDetails();
  }, [splitId]);

  const loadSplitDetails = async () => {
    setLoading(true);
    try {
      const response = await workoutApi.getSplit(splitId);
      setSplit(response.data);
      if (response.data.days && response.data.days.length > 0) {
        const currentId = selectedDayId || response.data.days[0].id;
        setSelectedDayId(currentId);
        const activeDay =
          response.data.days.find((d) => d.id === currentId) ||
          response.data.days[0];
        setCurrentDayData(activeDay);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load workout split.');
    } finally {
      setLoading(false);
    }
  };

  const handleDaySelect = (dayObj) => {
    setSelectedDayId(dayObj.id);
    setCurrentDayData(dayObj);
  };

  const handleRestToggle = async (e) => {
    const isRest = e.target.checked;
    const updated = { ...currentDayData, is_rest_day: isRest };
    setCurrentDayData(updated);

    try {
      await workoutApi.updateWorkoutDay(currentDayData.id, {
        is_rest_day: isRest,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setCurrentDayData({ ...currentDayData, title: newTitle });
  };

  const handleSaveTitle = async () => {
    try {
      await workoutApi.updateWorkoutDay(currentDayData.id, {
        title: currentDayData.title,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExercise = async (selectedExercise) => {
    const exerciseId =
      typeof selectedExercise === 'object'
        ? selectedExercise.id
        : selectedExercise;

    if (!exerciseId || !currentDayData) return;

    setSaving(true);
    try {
      for (let i = 1; i <= 3; i++) {
        await workoutApi.addPlannedExercise({
          workout_day: currentDayData.id,
          exercise: Number(exerciseId),
          set_number: i,
          order: 1,
        });
      }

      await loadSplitDetails();
    } catch (err) {
      console.error('Error adding exercise:', err.response?.data || err);
      setError(
        JSON.stringify(err.response?.data) || 'Could not add exercise.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSets = async (exerciseId, newSetCount) => {
    if (newSetCount < 1) return;
    setSaving(true);
    try {
      const existingSets = (currentDayData.planned_exercises || [])
        .filter((pe) => (pe.exercise_detail?.id || pe.exercise) === exerciseId)
        .sort((a, b) => a.set_number - b.set_number);

      const currentCount = existingSets.length;

      if (newSetCount > currentCount) {
        for (let i = currentCount + 1; i <= newSetCount; i++) {
          await workoutApi.addPlannedExercise({
            workout_day: currentDayData.id,
            exercise: Number(exerciseId),
            set_number: i,
            order: 1,
          });
        }
      } else if (newSetCount < currentCount) {
        const setsToRemove = existingSets.slice(newSetCount);
        for (const s of setsToRemove) {
          await workoutApi.deletePlannedExercise(s.id);
        }
      }

      await loadSplitDetails();
    } catch (err) {
      console.error('Error updating sets:', err.response?.data || err);
      setError('Could not update sets count.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExerciseGroup = async (exerciseId) => {
    setSaving(true);
    const existingSets = (currentDayData.planned_exercises || []).filter(
      (pe) => (pe.exercise_detail?.id || pe.exercise) === exerciseId
    );
    try {
      for (const s of existingSets) {
        await workoutApi.deletePlannedExercise(s.id);
      }
      await loadSplitDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Final Save & Navigate Back
  const handleSaveAndReturn = async () => {
    setSaving(true);
    try {
      if (currentDayData) {
        await workoutApi.updateWorkoutDay(currentDayData.id, {
          title: currentDayData.title,
          is_rest_day: currentDayData.is_rest_day,
        });
      }
      navigate('/workout/splits');
    } catch (err) {
      console.error(err);
      navigate('/workout/splits');
    } finally {
      setSaving(false);
    }
  };

  const groupedExercises = useMemo(() => {
    if (!currentDayData || !currentDayData.planned_exercises) return [];
    const map = {};
    currentDayData.planned_exercises.forEach((pe) => {
      const exId = pe.exercise_detail?.id || pe.exercise;
      if (!map[exId]) {
        map[exId] = {
          exerciseId: exId,
          name: pe.exercise_detail?.name || 'Exercise',
          category: pe.exercise_detail?.category || 'General',
          setsCount: 0,
        };
      }
      map[exId].setsCount += 1;
    });
    return Object.values(map);
  }, [currentDayData]);

  if (loading) {
    return (
      <div className="page flex justify-center">
        <div className="spinner" role="status" />
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="btn-ghost" onClick={() => navigate('/workout/splits')}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSaveAndReturn} disabled={saving}>
          {saving ? 'Saving...' : 'Save and return'}
        </button>
      </div>

      <h1 className="text-3xl font-bold">Configure {split?.name}</h1>
      {error && <div className="alert-error">{error}</div>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {split?.days?.map((day) => (
          <button
            key={day.id}
            type="button"
            className={`whitespace-nowrap ${selectedDayId === day.id ? 'btn-sky' : 'btn-ghost'}`}
            onClick={() => handleDaySelect(day)}
          >
            Day {day.day_number}: {day.title}
          </button>
        ))}
      </div>

      {currentDayData && (
        <div className="card space-y-5">
          <div className="grid items-end gap-4 md:grid-cols-2">
            <div>
              <label className="label">Day title</label>
              <input
                type="text"
                className="field"
                value={currentDayData.title || ''}
                onChange={handleTitleChange}
                onBlur={handleSaveTitle}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-zinc-950 text-emerald-400"
                checked={Boolean(currentDayData.is_rest_day)}
                onChange={handleRestToggle}
              />
              Mark as rest day
            </label>
          </div>

          {!currentDayData.is_rest_day ? (
            <div>
              <ExerciseSearch
                onSelectExercise={handleAddExercise}
                existingExerciseIds={groupedExercises.map((g) => g.exerciseId)}
              />

              <h2 className="mb-3 mt-4 text-sm font-semibold uppercase tracking-wider text-sky-300">
                Planned exercises {saving && <span className="text-zinc-500">(updating)</span>}
              </h2>

              {groupedExercises.length === 0 ? (
                <p className="text-zinc-400">No exercises on this day yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupedExercises.map((item) => (
                    <div key={item.exerciseId} className="grid items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/50 p-3 md:grid-cols-6">
                      <div className="md:col-span-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.category}</p>
                      </div>
                      <label className="text-xs text-zinc-400 md:col-span-2">
                        Sets
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="field mt-1"
                          value={item.setsCount}
                          disabled={saving}
                          onChange={(e) => handleUpdateSets(item.exerciseId, parseInt(e.target.value, 10) || 1)}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={saving}
                        onClick={() => handleDeleteExerciseGroup(item.exerciseId)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="alert-info">Exercises stay hidden while this day is a rest day.</div>
          )}

          <div className="flex justify-end border-t border-white/10 pt-4">
            <button type="button" className="btn-primary" onClick={handleSaveAndReturn} disabled={saving}>
              {saving ? 'Saving...' : 'Save split and exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditWorkoutDay;