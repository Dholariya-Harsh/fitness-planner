import axios from 'axios';

// Assumes baseURL is configured or uses default environment standard
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/',
});

// Interceptor to attach Authorization JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workoutApi = {
  // Exercises
  getExercises: (params) => API.get('fitness/exercises/', { params }),
  createExercise: (data) => API.post('fitness/exercises/', data),

  // Splits
  getSplits: () => API.get('fitness/workout-splits/'),
  getSplit: (id) => API.get(`fitness/workout-splits/${id}/`),
  createSplit: (data) => API.post('fitness/workout-splits/', data),
  updateSplit: (id, data) => API.put(`fitness/workout-splits/${id}/`, data),
  deleteSplit: (id) => API.delete(`fitness/workout-splits/${id}/`),
  activateSplit: (id) => API.post(`fitness/workout-splits/${id}/activate/`),

  // Workout Days
  getWorkoutDay: (id) => API.get(`fitness/workout-days/${id}/`),
  updateWorkoutDay: (id, data) => API.patch(`fitness/workout-days/${id}/`, data),

  // Planned Exercises
  addPlannedExercise: (data) => API.post('fitness/planned-exercises/', data),
  updatePlannedExercise: (id, data) => API.patch(`fitness/planned-exercises/${id}/`, data),
  deletePlannedExercise: (id) => API.delete(`fitness/planned-exercises/${id}/`),

  // Workout Logs (Actual performance)
  getWorkoutLogs: (params) => API.get('fitness/workout-logs/', { params }),
  createWorkoutLog: (data) => API.post('fitness/workout-logs/', data),
};