// src/pages/Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError('Emër përdoruesi ose fjalëkalim i gabuar');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Hyni në llogarinë tuaj</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="input-group">
          <input
            type="text"
            placeholder="Adresa e email-it ose emri i perdoruesit"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <input
            type="password"
            placeholder="Fjalëkalimi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button">
          Hyr
        </button>
        
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Nuk ke nje llogari?{' '}
          <span 
            onClick={() => navigate('/signup')} 
            style={{ color: '#3498db', cursor: 'pointer' }}
          >
            Regjistrohu
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;