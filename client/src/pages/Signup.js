// src/pages/Signup.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css'; // We'll reuse the login styles

function Signup() {
  const [formData, setFormData] = useState({
    emer_perdoruesi: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 2MB limit
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('emer_perdoruesi', formData.emer_perdoruesi);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);

      if (selectedImage) {
        formDataToSend.append('profilePicture', selectedImage);
      }

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        // body: JSON.stringify({
        //   emer_perdoruesi: formData.emer_perdoruesi,
        //   email: formData.email,
        //   password: formData.password
        // }),
        body: formDataToSend
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" id='signup' onSubmit={handleSubmit}>
        <h2 className="login-title">Krijo një llogari</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form">
        

  <div className="left">
        <div className="input-group">
          <input
            type="text"
            name="emer_perdoruesi"
            placeholder="Emri i përdoruesit"
            value={formData.emer_perdoruesi}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Adresa e email-it"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="Fjalëkalimi"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            name="confirmPassword"
            placeholder="Rishkruaj fjalëkalimin"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="profile-picture-section">
          <div className="profile-picture">
            {imagePreview ? (
              <img 
                src={imagePreview}
                alt="Profile preview" 
                className="profile-preview"
              />
            ) : (
              <div className="profile-placeholder">
                {formData.emer_perdoruesi ? 
                  formData.emer_perdoruesi.charAt(0).toUpperCase() : 
                  'U'
                }
              </div>
            )}
          </div>
          <div className="profile-upload">
            <label className="upload-button" htmlFor="profile-picture">
              Zgjidhni një foto profili
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
  </div>

        <button type="submit" className="login-button">
          Regjistrohu
        </button>

        <p className="login-link" style={{ marginTop: '1rem', textAlign: 'center' }}>
          Ke një llogari?{' '}
          <span 
            onClick={() => navigate('/')} 
            className="link-text"
            style={{ color: '#3498db', cursor: 'pointer' }}
          >
            Hyr 
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;