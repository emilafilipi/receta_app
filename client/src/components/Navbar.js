// src/components/Navbar.js
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
      <button className="nav-link" onClick={() => navigate('/dashboard')}>Menaxhimi i Recetave të Gatimit</button>
        </div>
      <div className="navbar-menu">
      <button 
        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}>
          Faqja kryesore
      </button>
      <button 
        className={`nav-link ${location.pathname === '/my-recipes' ? 'active' : ''}`}
        onClick={() => navigate('/my-recipes')}>
          Recetat e mia
      </button>

        {user?.role === 'admin' && (
          <button 
          className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} 
          onClick={() => navigate('/admin')}>Faqja e Administratorit</button>
        )}
      </div>
      {/* <div className="navbar-user">
        <span className="username">{user?.emer_perdoruesi}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div> */}
      <div className="navbar-user" ref={menuRef}>
        <div 
          className="username-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {user?.foto_profili ? (
            <img 
              src={user.foto_profili} 
              alt="Profile" 
              className="profile-pic"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = ''; // Set a default image or remove to show initials
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
                const initials = e.target.parentElement.querySelector('.profile-initials');
                if (initials) {
                  initials.style.display = 'flex';
                }
              }}
            />
          ) : (
            <div className="profile-initials">
              {user?.emer_perdoruesi?.charAt(0).toUpperCase()}
            </div>
          )}
          <span>{user?.emer_perdoruesi}</span>
          <i className="arrow-down"></i>
        </div>
        {isMenuOpen && (
          <div className="user-dropdown">
            <button onClick={() => navigate('/profile')}>
              Modifiko Profilin
            </button>
            <button onClick={handleLogout}>
              Dil
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;