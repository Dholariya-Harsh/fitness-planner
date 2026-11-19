import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Grab optional redirected state message (e.g., from Register page)
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send request to Django REST Framework token/login endpoint
      const response = await axios.post(`${API_URL}auth/login/`, {
        username: formData.username.trim(),
        password: formData.password,
      });

      // Extract token (supports standard JWT 'access' key or SimpleJWT/TokenAuth 'token' key)
      const token = response.data.access || response.data.token;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem(
          'user',
          JSON.stringify(response.data.user || { username: formData.username })
        );

        // ✅ IMPORTANT: Redirect to '/' (where Dashboard is registered in App.jsx)
        navigate('/', { replace: true });
      } else {
        setError('Login succeeded, but no authorization token was returned.');
      }
    } catch (err) {
      console.error('Login Error:', err.response?.data);
      if (err.response && err.response.data) {
        setError(
          err.response.data.detail ||
            err.response.data.non_field_errors?.[0] ||
            'Invalid username or password.'
        );
      } else {
        setError('Unable to reach the backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">FitnessPlanner</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">Sign in and pick up today’s training.</p>
      </div>

      <div className="card">
        {successMessage && <div className="alert-ok mb-4">{successMessage}</div>}
        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              name="username"
              className="field"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="field"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          New here?{' '}
          <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;