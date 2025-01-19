// src/pages/AdminDashboard.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminOverview from '../components/admin/AdminOverview';
import ManageUsers from '../components/admin/ManageUsers';
import ManageRecipes from '../components/admin/ManageRecipes';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    pendingRecipes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Only allow admin access
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Navbar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Paneli i Administratorit</h1>
        </div>

        <div className="stats-cards">
          <div className="stat-card" onClick={() => setActiveTab('users')}>
            <h3>Numri i Përdoruesëve</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('recipes')}>
            <h3>Numri i Recetave</h3>
            <p className="stat-number">{stats.totalRecipes}</p>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('recipes')}>
            <h3>Receta të Paaprovuara</h3>
            <p className="stat-number">{stats.pendingRecipes}</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Statistika të Përgjithshme
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Menaxho Përdoruesit
          </button>
          <button
            className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            Menaxho Recetat
          </button>
          <button
            className={`tab-button `}
            onClick={() => navigate('/recipes/new')}
          >
            Krijo Recetë të Re
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && <AdminOverview stats={stats} />}
          {activeTab === 'users' && <ManageUsers />}
          {activeTab === 'recipes' && <ManageRecipes />}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;