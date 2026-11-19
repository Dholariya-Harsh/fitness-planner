import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api/workoutApi';

const AddExercise = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: 'CHEST',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryChoices = [
    { value: 'CHEST', label: 'Chest' },
    { value: 'BACK', label: 'Back' },
    { value: 'LEGS', label: 'Legs' },
    { value: 'SHOULDERS', label: 'Shoulders' },
    { value: 'ARMS', label: 'Arms' },
    { value: 'CORE', label: 'Core' },
    { value: 'CARDIO', label: 'Cardio' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await workoutApi.createExercise(formData);
      navigate('/workout/splits');
    } catch (err) {
      console.error('Error creating exercise:', err);
      const serverErr = err.response?.data;
      
      if (serverErr) {
        if (serverErr.name) {
          setError(`Name: ${serverErr.name.join(' ')}`);
        } else if (serverErr.category) {
          setError(`Category: ${serverErr.category.join(' ')}`);
        } else if (serverErr.detail) {
          setError(serverErr.detail);
        } else {
          setError('Failed to add exercise. Please check input data.');
        }
      } else {
        setError('Network error. Unable to reach server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <div className="card">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-emerald-400">Add exercise</h1>
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Exercise name</label>
            <input
              type="text"
              name="name"
              className="field"
              placeholder="Incline bench press"
              value={formData.name}
              onChange={handleChange}
              maxLength={150}
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="field" value={formData.category} onChange={handleChange}>
              {categoryChoices.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows="3"
              className="field"
              placeholder="Form cues, target muscles, or instructions"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Adding exercise...' : 'Add exercise'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExercise;