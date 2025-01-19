// src/pages/UserProfile.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/UserProfile.css';

function UserProfile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // const [profileImage, setProfileImage] = useState(null);
  // const [previewUrl, setPreviewUrl] = useState(user?.foto_profili || null);
  const [formData, setFormData] = useState({
    emer_perdoruesi: user?.emer_perdoruesi || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Update preview URL when user data changes
    if (user?.foto_profili) {
      setImagePreview(user.foto_profili);
    }
  }, [user]);

  const hasChanges = () => {
    const usernameChanged = formData.emer_perdoruesi !== user?.emer_perdoruesi;
    const emailChanged = formData.email !== user?.email;
    const passwordChanged = formData.newPassword.length > 0;

    return usernameChanged || emailChanged || passwordChanged;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('emer_perdoruesi', formData.emer_perdoruesi);
      formDataToSend.append('email', formData.email);

      if (formData.currentPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }

      if (selectedImage) {
        formDataToSend.append('profilePicture', selectedImage);
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local user data
      login({
        user: data.user,
        token: localStorage.getItem('token')
      });

      setSuccessMessage('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(err.message);
    }
  };

  const getProfileImage = () => {
    if (imagePreview) {
      return imagePreview;
    }
    if (user?.foto_profili) {
      return user.foto_profili;
    }
    return null;
  };

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <h2>Modifiko të Dhënat e Profilit Personal</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-picture-section">
            <div className="profile-picture">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()}
                  alt="Profile"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentElement.querySelector('.profile-placeholder');
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <div className="profile-placeholder">
                  {formData.emer_perdoruesi?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-picture-upload">
              <label className="upload-button" htmlFor="profile-picture">
                Ndrysho foton e profilit
              </label>
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Emri i përdoruesit</label>
            <input
              type="text"
              name="emer_perdoruesi"
              value={formData.emer_perdoruesi}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Adresa e email-it</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="password-section">
            <h3>Ndrysho fjalëkalimin</h3>
            <div className="form-group">
              <label>Fjalëkalimi aktual</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Fjalëkalimi i ri</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Përsërit fjalëkalimin e ri</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="cancel-button" onClick={() => navigate('/dashboard')}>
              Anulo
            </button>
            <button type="submit" className="save-button" 
            // disabled={!hasChanges()}
            > 
              Ruaj ndryshimet
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default UserProfile;