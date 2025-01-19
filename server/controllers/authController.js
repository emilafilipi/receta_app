const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authController = {
  // login: async (req, res) => {
  //   try {
  //     const { email, password } = req.body;

  //     // Get user from database
  //     const [users] = await pool.execute(
  //       'SELECT * FROM perdoruesit WHERE email = ?',
  //       [email]
  //     );

  //     if (users.length === 0) {
  //       return res.status(401).json({ message: 'Invalid credentials' });
  //     }

  //     const user = users[0];

  //     // Check password
  //     const isValidPassword = await bcrypt.compare(password, user.fjalekalimi_hash);
  //     if (!isValidPassword) {
  //       return res.status(401).json({ message: 'Invalid credentials' });
  //     }

  //     // Generate JWT token
  //     const token = jwt.sign(
  //       { id: user.perdoruesi_id, role: user.roli },
  //       process.env.JWT_SECRET || 'your-secret-key',
  //       { expiresIn: '1d' }
  //     );

  //     res.json({
  //       token,
  //       user: {
  //         id: user.perdoruesi_id,
  //         email: user.email,
  //         emer_perdoruesi: user.emer_perdoruesi,
  //         role: user.roli
  //       }
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // },
  
  login: async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      // Get user from database using either email or username
      const [users] = await pool.execute(
        'SELECT * FROM perdoruesit WHERE email = ? OR emer_perdoruesi = ?',
        [emailOrUsername, emailOrUsername]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.fjalekalimi_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.perdoruesi_id, role: user.roli },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      res.json({
        token,
        user: {
          id: user.perdoruesi_id,
          email: user.email,
          emer_perdoruesi: user.emer_perdoruesi,
          role: user.roli,
          // url_foto: user.url_foto ? `http://localhost:5000${user.url_foto}` : null
          foto_profili: user.foto_profili ? `http://localhost:5000${user.foto_profili}` : null
          // url_foto: user.foto_profili ? `http://localhost:5000${user.foto_profili}` : null
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  signup: async (req, res) => {
    try {
      const { emer_perdoruesi, email, password } = req.body;

      // Check if user already exists
      const [existingUsers] = await pool.execute(
        'SELECT * FROM perdoruesit WHERE email = ? OR emer_perdoruesi = ?',
        [email, emer_perdoruesi]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ 
          message: 'Ekziston një përdorues me këtë adresë emaili ose emër përdoruesi' 
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const fjalekalimi_hash = await bcrypt.hash(password, salt);

      // Handle profile picture if uploaded
      let profilePicturePath = null;
      if (req.file) {
        profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      }

      // Insert new user
      const [result] = await pool.execute(
        `INSERT INTO perdoruesit (emer_perdoruesi, email, fjalekalimi_hash, roli, eshte_aktiv, foto_profili) 
         VALUES (?, ?, ?, 'Përdorues', true, ?)`,
        [emer_perdoruesi, email, fjalekalimi_hash, profilePicturePath]
      );

      // Generate token
      const token = jwt.sign(
        { id: result.insertId, role: 'user' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      res.status(201).json({
        token,
        user: {
          id: result.insertId,
          email,
          emer_perdoruesi,
          role: 'Përdorues',
          foto_profili: profilePicturePath ? `http://localhost:5000${profilePicturePath}` : null
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = authController;