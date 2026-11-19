import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/',
});

// 1. Attach JWT Token to Requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Handle Invalid Token / Deleted User Automatically
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (  
      error.response &&
      (error.response.status === 401 ||
        error.response.data?.detail === 'User not found')
    ) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const nutritionApi = {
  // Food Items (Single Ingredients)
  getFoodItems: (params) => API.get('fitness/foods/', { params }),
  getFoodItem: (id) => API.get(`fitness/foods/${id}/`),
  createFoodItem: (data) => API.post('fitness/foods/', data),
  updateFoodItem: (id, data) => API.put(`fitness/foods/${id}/`, data),
  deleteFoodItem: (id) => API.delete(`fitness/foods/${id}/`),

  // Meals (Composite Recipes)
  getMeals: (params) => API.get('fitness/meals/', { params }),
  getMeal: (id) => API.get(`fitness/meals/${id}/`),
  createMeal: (data) => API.post('fitness/meals/', data),
  updateMeal: (id, data) => API.put(`fitness/meals/${id}/`, data),
  deleteMeal: (id) => API.delete(`fitness/meals/${id}/`),
  addIngredientToMeal: (mealId, data) => API.post(`fitness/meals/${mealId}/add-ingredient/`, data),

  // Daily Meal Logs
  getDailyLogs: (date) => API.get(`fitness/daily-meal-logs/?date=${date}`),
  logMeal: (payload) => API.post('fitness/daily-meal-logs/', payload),
  deleteLog: (id) => API.delete(`fitness/daily-meal-logs/${id}/`),

  // Water Logs (Fixed: Uses API instance and correct route path)
  getWaterLogs: (date) => {
    const query = date && date !== 'all' ? `?date=${date}` : '';
    return API.get(`fitness/water-logs/${query}`);
  },
  logWater: (payload) => API.post('fitness/water-logs/', payload),
  deleteWaterLog: (id) => API.delete(`fitness/water-logs/${id}/`),

  // Sleep Logs
  getSleepLogs: (date) => {
    const query = date && date !== 'all' ? `?date=${date}` : '';
    return API.get(`fitness/sleep-logs/${query}`);
  },
  logSleep: (payload) => API.post('fitness/sleep-logs/', payload),
  deleteSleepLog: (id) => API.delete(`fitness/sleep-logs/${id}/`),
};