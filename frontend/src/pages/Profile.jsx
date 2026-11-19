import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';
const ACTIVITY_VALUES = ['1.2', '1.375', '1.55', '1.725', '1.9'];

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const matchActivity = (value) => {
  const numeric = Number(value);
  return ACTIVITY_VALUES.find((option) => Math.abs(Number(option) - numeric) < 0.02) || '1.2';
};

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    age: 25,
    gender: 'M',
    height: 175.0,
    weight: 70.0,
    goal: 'MAINTAIN',
    activity_level: '1.2',
    target_calories: 0,
    bmi: 0,
    bmr: 0,
    tdee: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Django UserProfile details on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}auth/profile/`, { headers: authHeaders() });
      setProfile({
        ...response.data,
        gender: response.data.gender || 'M',
        goal: response.data.goal || 'MAINTAIN',
        activity_level: matchActivity(response.data.activity_level),
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'gender' || name === 'goal' || name === 'activity_level' ? value : parseFloat(value) || value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        age: parseInt(profile.age, 10),
        gender: profile.gender,
        height: parseFloat(profile.height),
        weight: parseFloat(profile.weight),
        activity_level: parseFloat(profile.activity_level),
        goal: profile.goal,
      };

      const response = await axios.patch(`${API_URL}auth/profile/`, payload, { headers: authHeaders() });
      setProfile({
        ...response.data,
        gender: response.data.gender || 'M',
        goal: response.data.goal || 'MAINTAIN',
        activity_level: matchActivity(response.data.activity_level),
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile settings.');
    }
  };

  if (loading) {
    return (
      <div className="page flex flex-col items-center text-center">
        <div className="spinner" role="status" />
        <p className="mt-3 text-sm text-zinc-400">Loading profile...</p>
      </div>
    );
  }

  const avatarInitial = (profile.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/')}>
        Back to dashboard
      </button>

      <div className="card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-400 text-xl font-bold text-zinc-950">
            {avatarInitial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sky-300">{profile.username || 'Athlete'}</h1>
            <p className="text-sm text-zinc-400">{profile.email || 'No email on file'}</p>
          </div>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}
        {successMessage && <div className="alert-ok mb-4">{successMessage}</div>}

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            ['Target', profile.target_calories ? `${Math.round(profile.target_calories)}` : '—', 'kcal'],
            ['BMI', profile.bmi ? Number(profile.bmi).toFixed(1) : '—', ''],
            ['BMR', profile.bmr ? Math.round(profile.bmr) : '—', 'kcal'],
            ['TDEE', profile.tdee ? Math.round(profile.tdee) : '—', 'kcal'],
          ].map(([label, value, unit]) => (
            <div key={label} className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-sky-300">{value}</p>
              {unit && <p className="text-xs text-zinc-500">{unit}</p>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-300">Physical stats and goals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Age</label>
              <input type="number" className="field" name="age" value={profile.age} onChange={handleChange} required min="10" max="120" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="field" name="gender" value={profile.gender} onChange={handleChange}>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" step="0.1" className="field" name="height" value={profile.height} onChange={handleChange} required min="50" max="250" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="field" name="weight" value={profile.weight} onChange={handleChange} required min="20" max="300" />
            </div>
            <div>
              <label className="label">Fitness goal</label>
              <select className="field" name="goal" value={profile.goal} onChange={handleChange}>
                <option value="LOSE">Weight loss</option>
                <option value="GAIN">Muscle gain</option>
                <option value="MAINTAIN">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="label">Activity level</label>
              <select className="field" name="activity_level" value={profile.activity_level} onChange={handleChange}>
                <option value={1.2}>Sedentary</option>
                <option value={1.375}>Lightly active</option>
                <option value={1.55}>Moderate</option>
                <option value={1.725}>Very active</option>
                <option value={1.9}>Extra active</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;