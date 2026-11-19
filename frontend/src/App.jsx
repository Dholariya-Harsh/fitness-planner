import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import WorkoutPage from './pages/WorkoutPage';
import SplitList from './pages/SplitList';
import CreateSplit from './pages/CreateSplit';
import EditWorkoutDay from './pages/EditWorkoutDay';
import IngredientList from './pages/IngredientList';
import AddIngredient from './pages/AddIngredient';
import AddMeal from './pages/AddMeal';
import MealDetails from './pages/MealDetails';
import WaterTracker from './pages/WaterTracker';
import SleepTracker from './pages/SleepTracker';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import AddExercise from './pages/AddExercise';
import NutritionPage from './pages/NutritionPage';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/workout/splits" element={<SplitList />} />
              <Route path="/workout/splits/create" element={<CreateSplit />} />
              <Route path="/workout/splits/new" element={<CreateSplit />} />
              <Route path="/workout/split/:splitId/edit" element={<EditWorkoutDay />} />
              <Route path="/workout/day/:id" element={<EditWorkoutDay />} />
              <Route path="/exercises/new" element={<AddExercise />} />
              <Route path="/workout/history" element={<WorkoutHistoryPage />} />

              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/nutrition/ingredients" element={<IngredientList />} />
              <Route path="/nutrition/add-ingredient" element={<AddIngredient />} />
              <Route path="/nutrition/add-meal" element={<AddMeal />} />
              <Route path="/nutrition/meal/:mealId" element={<MealDetails />} />
              <Route path="/nutrition/meal/:id" element={<MealDetails />} />

              <Route path="/water" element={<WaterTracker />} />
              <Route path="/sleep" element={<SleepTracker />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
