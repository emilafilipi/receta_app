// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import { useAuth } from './context/AuthContext';
import RecipeDetail from './pages/RecipeDetail';
import AdminDashboard from './pages/AdminDashboard';
import MyRecipes from './pages/MyRecipes';
import AddRecipe from './pages/AddRecipe';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return children;
}

// Admin Route Component
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recipe/:id" 
            element={
              <ProtectedRoute>
                <RecipeDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-recipes" 
            element={
              <ProtectedRoute>
                <MyRecipes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recipes/new" 
            element={
              <ProtectedRoute>
                <AddRecipe />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;