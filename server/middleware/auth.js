const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    console.log('Authenticated user:', req.user); // Debug log
    next();
  } catch (error) {
    console.error('Auth middleware error:', error); // Debug log
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;