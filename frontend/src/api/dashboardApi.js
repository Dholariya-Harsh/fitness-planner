import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardApi = {
  // Aggregate summary data for today's user dashboard
  getTodaySummary: () => API.get('fitness/dashboard/today/'),
  
  // Quick logs directly from Dashboard
  quickAddWater: (amountMl) => API.post('fitness/water/log/', { amount: amountMl }),
};