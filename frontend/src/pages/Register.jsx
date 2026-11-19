import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '25',
    gender: 'male',
    height: '175',
    weight: '70',
    fitness_goal: 'muscle_gain', // Options: weight_loss, muscle_gain, maintenance
    activity_level: 'moderate',  // Options: sedentary, lightly_active, moderate, very_active
  });

  const [calorieTarget, setCalorieTarget] = useState(2500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically recalculate TDEE / Calorie Target whenever stats change
  useEffect(() => {
    calculateTDEE();
  }, [formData.age, formData.gender, formData.height, formData.weight, formData.fitness_goal, formData.activity_level]);

  const calculateTDEE = () => {
    const weight = parseFloat(formData.weight) || 70;
    const height = parseFloat(formData.height) || 175;
    const age = parseFloat(formData.age) || 25;

    // Mifflin-St Jeor Equation for BMR
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (formData.gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Activity Multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    let tdee = bmr * (activityMultipliers[formData.activity_level] || 1.55);

    // Goal Adjustments
    if (formData.fitness_goal === 'weight_loss') {
      tdee -= 500;
    } else if (formData.fitness_goal === 'muscle_gain') {
      tdee += 300;
    }

    setCalorieTarget(Math.round(tdee));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Payload formatted to match standard Django User + Profile serializers
    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      profile: {
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        fitness_goal: formData.fitness_goal,
        activity_level: formData.activity_level,
        daily_calorie_target: calorieTarget,
      },
    };

    try {
      const response = await axios.post(`${API_URL}auth/register/`, payload);

      // Handle direct token return or redirect to login
      if (response.data.access || response.data.token) {
        localStorage.setItem('token', response.data.access || response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || { username: formData.username }));
        navigate('/');
      } else {
        // Fallback: If backend registration doesn't issue a token immediately
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (err) {
      console.error('Registration Error:', err.response?.data);
      if (err.response && err.response.data) {
        // Format Django REST Framework error responses nicely
        const serverErrors = err.response.data;
        if (typeof serverErrors === 'string') {
          setError(serverErrors);
        } else if (serverErrors.username) {
          setError(`Username: ${serverErrors.username[0]}`);
        } else if (serverErrors.email) {
          setError(`Email: ${serverErrors.email[0]}`);
        } else if (serverErrors.password) {
          setError(`Password: ${serverErrors.password[0]}`);
        } else if (serverErrors.detail) {
          setError(serverErrors.detail);
        } else {
          setError('Registration failed. Please check your inputs and try again.');
        }
      } else {
        setError('Unable to connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">FitnessPlanner</p>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-400">Set your stats and we’ll estimate a daily calorie target.</p>
      </div>

      <div className="card">
        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">Account</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Username</label>
                <input type="text" name="username" className="field" value={formData.username} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" className="field" value={formData.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" name="password" className="field" value={formData.password} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input type="password" name="confirmPassword" className="field" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">Body and goals</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Age</label>
                <input type="number" name="age" className="field" value={formData.age} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" className="field" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" name="height" className="field" value={formData.height} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" step="0.1" name="weight" className="field" value={formData.weight} onChange={handleChange} required />
              </div>
              <div>
                <label className="label">Fitness goal</label>
                <select name="fitness_goal" className="field" value={formData.fitness_goal} onChange={handleChange}>
                  <option value="weight_loss">Weight loss</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="label">Activity level</label>
                <select name="activity_level" className="field" value={formData.activity_level} onChange={handleChange}>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly_active">Lightly active</option>
                  <option value="moderate">Moderate</option>
                  <option value="very_active">Very active</option>
                </select>
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Estimated daily calorie target</p>
            <p className="mt-1 text-3xl font-bold text-sky-300">{calorieTarget} kcal</p>
            <p className="mt-1 text-xs text-zinc-400">Calculated from BMR and TDEE as you edit the form.</p>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;