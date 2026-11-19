import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi';

export default function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailyLogs, setDailyLogs] = useState([]);
  const [meals, setMeals] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toggle state for Nutrition History/Log View
  const [showHistory, setShowHistory] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [selectedMeal, setSelectedMeal] = useState('');
  const [mealType, setMealType] = useState('Breakfast');
  const [servings, setServings] = useState(1);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const extractArray = (resData) => {
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.results)) return resData.results;
    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsRes, mealsRes, foodsRes] = await Promise.all([
        nutritionApi.getDailyLogs(selectedDate),
        nutritionApi.getMeals(),
        nutritionApi.getFoodItems(),
      ]);

      setDailyLogs(extractArray(logsRes.data));
      setMeals(extractArray(mealsRes.data));
      setFoodItems(extractArray(foodsRes.data));
    } catch (err) {
      console.error(err);
      setError('Failed to load nutrition data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllHistory = async () => {
    setHistoryLoading(true);
    setError('');
    try {
      // Pass 'all' or empty parameter depending on backend route setup
      const res = await nutritionApi.getDailyLogs('all').catch(() => nutritionApi.getDailyLogs(''));
      const fetchedLogs = extractArray(res.data);

      // Merge fetched history with currently loaded daily logs to guarantee today's items are visible
      const mergedLogs = [...fetchedLogs, ...dailyLogs];
      
      // Deduplicate by log ID
      const uniqueLogs = Array.from(
        new Map(mergedLogs.map((item) => [item.id, item])).values()
      );

      setAllLogs(uniqueLogs);
    } catch (err) {
      console.error(err);
      // Fallback: show at least currently loaded logs if all-history query fails
      setAllLogs(dailyLogs);
      setError('Could not fetch historical logs; showing available local entries.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchAllHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!selectedMeal) return;

    try {
      const payload = {
        meal: selectedMeal,
        meal_type: mealType,
        servings: parseFloat(servings),
        date: selectedDate,
      };
      const res = await nutritionApi.logMeal(payload);
      const newLog = res.data;
      setDailyLogs((prev) => [newLog, ...(Array.isArray(prev) ? prev : [])]);
      setAllLogs((prev) => [newLog, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedMeal('');
      setServings(1);
    } catch (err) {
      console.error(err);
      setError('Failed to log meal.');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await nutritionApi.deleteLog(id);
      setDailyLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
      setAllLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
    } catch (err) {
      console.error(err);
      setError('Failed to delete log entry.');
    }
  };

  // Group all logs by date for the history view
  const logsByDate = useMemo(() => {
    if (!Array.isArray(allLogs)) return {};
    return allLogs.reduce((acc, log) => {
      const dateKey = log.date || selectedDate || 'Today';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(log);
      return acc;
    }, {});
  }, [allLogs, selectedDate]);

  // Safe Macro Totals calculation for selected date
  const safeLogs = Array.isArray(dailyLogs) ? dailyLogs : [];
  const totals = safeLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + (parseFloat(log.total_calories || log.meal?.calories) || 0) * (parseFloat(log.servings) || 1),
      protein: acc.protein + (parseFloat(log.total_protein || log.meal?.protein) || 0) * (parseFloat(log.servings) || 1),
      carbs: acc.carbs + (parseFloat(log.total_carbs || log.meal?.carbs) || 0) * (parseFloat(log.servings) || 1),
      fat: acc.fat + (parseFloat(log.total_fat || log.meal?.fat) || 0) * (parseFloat(log.servings) || 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const mealList = Array.isArray(meals) ? meals : [];
  const today = new Date().toISOString().split('T')[0];

  const dayTotals = (logs) =>
    logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (parseFloat(log.total_calories || log.meal?.calories) || 0) * (parseFloat(log.servings) || 1),
        protein: acc.protein + (parseFloat(log.total_protein || log.meal?.protein) || 0) * (parseFloat(log.servings) || 1),
        carbs: acc.carbs + (parseFloat(log.total_carbs || log.meal?.carbs) || 0) * (parseFloat(log.servings) || 1),
        fat: acc.fat + (parseFloat(log.total_fat || log.meal?.fat) || 0) * (parseFloat(log.servings) || 1),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const summary = [
    ['Consumed', `${totals.calories.toFixed(0)} kcal`, 'text-emerald-400'],
    ['Protein', `${totals.protein.toFixed(0)} g`, 'text-sky-300'],
    ['Carbs', `${totals.carbs.toFixed(0)} g`, 'text-amber-300'],
    ['Fat', `${totals.fat.toFixed(0)} g`, 'text-rose-300'],
  ];

  return (
    <div className="page space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Fuel</p>
          <h1 className="text-3xl font-bold">Nutrition</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={showHistory ? 'btn-sky' : 'btn-ghost'} onClick={handleToggleHistory}>
            {showHistory ? 'Back to tracker' : 'Nutrition log'}
          </button>
          {!showHistory && (
            <input type="date" className="field w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showHistory ? (
        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-sky-300">All days</h2>
          {historyLoading ? (
            <p className="text-zinc-400">Loading history...</p>
          ) : Object.keys(logsByDate).length === 0 ? (
            <p className="text-zinc-400">No nutrition logs yet.</p>
          ) : (
            Object.entries(logsByDate)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([dateStr, logs]) => {
                const day = dayTotals(logs);
                return (
                  <section key={dateStr} className="mb-4 rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <h3 className="font-semibold">{dateStr === today ? `${dateStr} · today` : dateStr}</h3>
                      <p className="text-sm text-zinc-400">
                        <span className="mr-2 font-semibold text-emerald-300">{day.calories.toFixed(0)} kcal</span>
                        P {day.protein.toFixed(1)}g · C {day.carbs.toFixed(1)}g · F {day.fat.toFixed(1)}g
                      </p>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 px-3 py-2">
                          <div>
                            <p className="font-semibold">
                              {log.meal_name || log.meal?.name || 'Meal'}
                              <span className="ml-2 text-xs text-sky-300">{log.meal_type || 'Meal'}</span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {log.servings} serving(s) · {((parseFloat(log.total_calories || log.meal?.calories) || 0) * (parseFloat(log.servings) || 1)).toFixed(0)} kcal
                            </p>
                          </div>
                          <button type="button" className="btn-danger" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map(([label, value, tone]) => (
              <div key={label} className="stat">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Log a meal</h2>
              <form onSubmit={handleLogMeal} className="space-y-4">
                <div>
                  <label className="label">Food or meal</label>
                  <select className="field" value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} required>
                    <option value="">Choose an item</option>
                    {mealList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.calories || 0} kcal)</option>
                    ))}
                  </select>
                  <div className="mt-2 text-right">
                    <Link to="/nutrition/add-meal" className="text-sm font-medium text-sky-300 hover:text-sky-200">
                      Add a new meal
                    </Link>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Meal type</label>
                    <select className="field" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Servings</label>
                    <input type="number" step="0.1" min="0.1" className="field" value={servings} onChange={(e) => setServings(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full py-2.5">Log meal</button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Meals on {selectedDate}</h2>
              {loading ? (
                <p className="text-zinc-400">Loading logs...</p>
              ) : safeLogs.length === 0 ? (
                <p className="text-zinc-400">Nothing logged for this day.</p>
              ) : (
                <div className="space-y-2">
                  {safeLogs.map((log) => {
                    const scale = parseFloat(log.servings) || 1;
                    const kcal = ((parseFloat(log.total_calories || log.meal?.calories) || 0) * scale).toFixed(0);
                    const protein = ((parseFloat(log.total_protein || log.meal?.protein) || 0) * scale).toFixed(1);
                    const carbs = ((parseFloat(log.total_carbs || log.meal?.carbs) || 0) * scale).toFixed(1);
                    const fat = ((parseFloat(log.total_fat || log.meal?.fat) || 0) * scale).toFixed(1);
                    return (
                      <div key={log.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                        <div>
                          <p className="font-semibold">
                            {log.meal_name || log.meal?.name || 'Logged meal'}
                            <span className="ml-2 text-xs text-sky-300">{log.meal_type || 'Meal'}</span>
                          </p>
                          <p className="text-xs text-zinc-500">
                            {log.servings} serving(s) · <span className="text-emerald-300">{kcal} kcal</span>
                          </p>
                          <p className="text-xs text-zinc-500">P {protein}g · C {carbs}g · F {fat}g</p>
                        </div>
                        <button type="button" className="btn-danger" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
