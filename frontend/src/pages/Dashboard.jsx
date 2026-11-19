import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Apple,
  CalendarDays,
  CircleCheck,
  Droplets,
  Dumbbell,
  Flame,
  Layers,
  Moon,
  Utensils,
} from 'lucide-react';
import { nutritionApi } from '../api/nutritionApi';
import { workoutApi } from '../api/workoutApi';
import DashboardQuickCard from '../components/DashboardQuickCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const percentOf = (value, max) => (max > 0 ? Math.min(100, (Number(value) / max) * 100) : 0);

const greetingForHour = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Meter = ({ value, max, tone = 'bg-emerald-400' }) => {
  const width = percentOf(value, max);
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${width}%` }} />
    </div>
  );
};

const Ring = ({ percent }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, percent);
  const within = Math.min(100, safe);
  const over = Math.min(100, Math.max(0, safe - 100));
  const baseOffset = circumference - (within / 100) * circumference;
  const overOffset = circumference - (over / 100) * circumference;
  const isOver = safe > 100;

  return (
    <div className="relative h-[92px] w-[92px] shrink-0" title={`${Math.round(safe)}% of calorie target`}>
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#34d399"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={baseOffset}
        />
        {isOver && (
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#fb7185"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overOffset}
          />
        )}
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${isOver ? 'text-rose-300' : 'text-zinc-100'}`}>
        {Math.round(safe)}%
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targetCalories, setTargetCalories] = useState(0);
  const [session, setSession] = useState(null);
  const [data, setData] = useState({
    user_name: 'Athlete',
    nutrition_today: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    water_today: { consumed_ml: 0, target_ml: 4000 },
    sleep_last_night: { hours: 0, quality: 'N/A' },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const greeting = greetingForHour(new Date().getHours());
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = storedUser.first_name || storedUser.username || 'Athlete';
    const token = localStorage.getItem('token');

    try {
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      let fiber = 0;

      try {
        const nutRes = await nutritionApi.getDailyLogs(todayStr);
        extractArray(nutRes.data).forEach((item) => {
          const detail = item.meal_detail || item.food_item_detail || item.meal || item.food_item || item;
          const servings = Number(item.servings || item.quantity || 1);
          calories += Number(item.total_calories || detail.calories || detail.total_calories || 0) * servings;
          protein += Number(item.total_protein || detail.protein || detail.total_protein || 0) * servings;
          carbs += Number(item.total_carbs || detail.carbs || detail.total_carbs || 0) * servings;
          fat += Number(item.total_fat || detail.fat || detail.total_fat || 0) * servings;
          fiber += Number(item.total_fiber || detail.fiber || detail.total_fiber || 0) * servings;
        });
      } catch (err) {
        console.warn('Failed to load nutrition summary:', err);
      }

      let waterConsumed = 0;
      try {
        const waterRes = await nutritionApi.getWaterLogs(todayStr);
        waterConsumed = extractArray(waterRes.data).reduce(
          (acc, log) => acc + Number(log.amount_ml || log.consumed_ml || log.amount || 0),
          0
        );
      } catch (err) {
        console.warn('Failed to load water summary:', err);
      }

      let sleepHours = 0;
      let sleepQuality = 'N/A';
      try {
        const sleepRes = await nutritionApi.getSleepLogs(todayStr);
        const sleepLogs = extractArray(sleepRes.data);
        if (sleepLogs.length > 0) {
          sleepHours = Number(sleepLogs[0].hours || sleepLogs[0].total_hours || 0);
          sleepQuality = `${sleepLogs[0].quality || 'N/A'}/5`;
        }
      } catch (err) {
        console.warn('Failed to load sleep summary:', err);
      }

      try {
        const profileRes = await axios.get(`${API_URL}auth/profile/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setTargetCalories(Number(profileRes.data.target_calories || 0));
      } catch (err) {
        console.warn('Failed to load calorie target:', err);
      }

      try {
        const jsDay = new Date().getDay();
        const dayNumber = jsDay === 0 ? 7 : jsDay;
        const splitsRes = await workoutApi.getSplits();
        const splits = extractArray(splitsRes.data);
        const active = splits.find((split) => split.is_active);
        const day = active?.days?.find((item) => item.day_number === dayNumber) || null;

        if (!active || !day) {
          setSession(null);
        } else if (day.is_rest_day) {
          setSession({
            splitName: active.name,
            title: day.title || 'Rest',
            isRest: true,
            exercises: [],
            completed: 0,
            planned: 0,
          });
        } else {
          const logsRes = await workoutApi.getWorkoutLogs({ workout_day: day.id, date: todayStr });
          const todayLog = extractArray(logsRes.data).find((log) => log.date === todayStr);
          const completed = (todayLog?.logged_sets || []).filter((set) => set.completed).length;
          const names = [];
          (day.planned_exercises || []).forEach((planned) => {
            const name = planned.exercise_detail?.name;
            if (name && !names.includes(name)) names.push(name);
          });
          setSession({
            splitName: active.name,
            title: day.title || 'Training',
            isRest: false,
            exercises: names,
            completed,
            planned: day.planned_exercises?.length || 0,
          });
        }
      } catch (err) {
        console.warn('Failed to load workout summary:', err);
      }

      setData({
        user_name: userName,
        nutrition_today: { calories, protein, carbs, fat, fiber },
        water_today: { consumed_ml: waterConsumed, target_ml: 4000 },
        sleep_last_night: { hours: sleepHours, quality: sleepQuality },
      });
    } catch (err) {
      console.error('Dashboard Error:', err);
      setError('Unable to fetch live metrics.');
    } finally {
      setLoading(false);
    }
  };

  const nutrition = data.nutrition_today;
  const macroTargets = useMemo(() => {
    if (!targetCalories) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: (targetCalories * 0.3) / 4,
      carbs: (targetCalories * 0.45) / 4,
      fat: (targetCalories * 0.25) / 9,
    };
  }, [targetCalories]);

  const macros = [
    { label: 'Protein', value: nutrition.protein, max: macroTargets.protein, unit: 'g', tone: 'bg-sky-400' },
    { label: 'Carbs', value: nutrition.carbs, max: macroTargets.carbs, unit: 'g', tone: 'bg-amber-300' },
    { label: 'Fat', value: nutrition.fat, max: macroTargets.fat, unit: 'g', tone: 'bg-rose-400' },
    { label: 'Fiber', value: nutrition.fiber, max: 30, unit: 'g', tone: 'bg-violet-400' },
  ];

  const actions = [
    { title: 'Log a meal', subtitle: 'Add what you ate today', path: '/nutrition/add-meal', icon: Utensils },
    { title: 'Today’s workout', subtitle: 'Open the session and mark sets', path: '/workout', icon: Dumbbell },
    { title: 'Log water', subtitle: 'Track intake against 4 L', path: '/water', icon: Droplets },
    { title: 'Log sleep', subtitle: 'Record hours and quality', path: '/sleep', icon: Moon },
    { title: 'Food library', subtitle: 'Browse meals and ingredients', path: '/nutrition', icon: Apple },
    { title: 'Training splits', subtitle: 'Review the weekly plan', path: '/workout/splits', icon: Layers },
  ];

  if (loading) {
    return (
      <div className="page flex flex-col items-center text-center">
        <div className="spinner" role="status" />
        <p className="mt-3 text-sm text-zinc-400">Loading daily summary...</p>
      </div>
    );
  }

  const caloriePercent = targetCalories > 0 ? (nutrition.calories / targetCalories) * 100 : 0;
  const waterPercent = percentOf(data.water_today.consumed_ml, data.water_today.target_ml);
  const sleepLogged = data.sleep_last_night.quality !== 'N/A';

  return (
    <div className="page space-y-8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Overview</p>
          <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
            <CalendarDays size={15} strokeWidth={1.75} className="text-emerald-300" />
            {todayLabel}
          </div>
        </div>
        <h1 className="mt-3 text-3xl font-bold">
          {greeting}, {data.user_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Calories, training, water, and sleep for today.</p>
      </div>

      {error && <div className="alert-warn">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="card lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                  <Flame size={16} strokeWidth={1.75} />
                </span>
                Energy intake
              </div>
              <p className="mt-4 text-4xl font-bold tracking-tight text-zinc-50">
                {formatNumber(nutrition.calories)}
                <span className="ml-2 text-base font-medium text-zinc-500">kcal</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {targetCalories
                  ? `of ${formatNumber(targetCalories)} kcal target`
                  : 'Set a profile goal to see a calorie target'}
              </p>
            </div>
            {targetCalories > 0 && <Ring percent={caloriePercent} />}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {macros.map((macro) => (
              <div key={macro.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="text-zinc-400">{macro.label}</span>
                  <span className="font-semibold text-zinc-100">
                    {formatNumber(macro.value, 1)}
                    <span className="font-normal text-zinc-500">
                      {macro.max ? ` / ${formatNumber(macro.max, 0)}${macro.unit}` : macro.unit}
                    </span>
                  </span>
                </div>
                <Meter value={macro.value} max={macro.max || macro.value || 1} tone={macro.tone} />
              </div>
            ))}
          </div>
        </section>

        <section className="card flex flex-col lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                <Dumbbell size={16} strokeWidth={1.75} />
              </span>
              Today’s session
            </div>
            {session && !session.isRest && session.planned > 0 && session.completed >= session.planned && (
              <CircleCheck size={18} strokeWidth={1.75} className="text-emerald-300" />
            )}
          </div>

          {session ? (
            <>
              <h2 className="mt-4 text-2xl font-bold">{session.title}</h2>
              <p className="text-sm text-zinc-400">{session.splitName}</p>
              {session.isRest ? (
                <p className="mt-4 text-sm text-zinc-300">Rest day. Recovery is part of the plan.</p>
              ) : (
                <>
                  <p className="mt-4 text-sm text-zinc-300">
                    {session.completed} of {session.planned} sets marked done
                  </p>
                  <div className="mt-2">
                    <Meter value={session.completed} max={session.planned || 1} />
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-zinc-400">
                    {session.exercises.slice(0, 4).map((name) => (
                      <li key={name} className="truncate">{name}</li>
                    ))}
                  </ul>
                </>
              )}
              <button type="button" className="btn-primary mt-5 self-start" onClick={() => navigate('/workout')}>
                <Dumbbell size={16} strokeWidth={1.75} />
                Open workout
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-2xl font-bold">No active plan</h2>
              <p className="mt-2 text-sm text-zinc-400">Activate a split to see today’s session here.</p>
              <button type="button" className="btn-ghost mt-5 self-start" onClick={() => navigate('/workout/splits')}>
                <Layers size={16} strokeWidth={1.75} />
                Manage splits
              </button>
            </>
          )}
        </section>

        <section className="card lg:col-span-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                <Droplets size={16} strokeWidth={1.75} />
              </span>
              Hydration
            </div>
            <span className="text-sm text-zinc-500">{Math.round(waterPercent)}%</span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">
            {formatNumber(data.water_today.consumed_ml)}
            <span className="ml-2 text-base font-medium text-zinc-500">ml</span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">of {formatNumber(data.water_today.target_ml)} ml</p>
          <div className="mt-4">
            <Meter value={data.water_today.consumed_ml} max={data.water_today.target_ml} tone="bg-sky-400" />
          </div>
        </section>

        <section className="card lg:col-span-6">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200">
              <Moon size={16} strokeWidth={1.75} />
            </span>
            Sleep
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">
            {formatNumber(data.sleep_last_night.hours, 1)}
            <span className="ml-2 text-base font-medium text-zinc-500">hours</span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {sleepLogged ? `Quality ${data.sleep_last_night.quality}` : 'Not logged yet'}
          </p>
          <div className="mt-4">
            <Meter value={data.sleep_last_night.hours} max={8} tone="bg-amber-300" />
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Shortcuts</h2>
          <p className="text-sm text-zinc-400">Jump into the logs you update most often.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <DashboardQuickCard key={action.path} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
