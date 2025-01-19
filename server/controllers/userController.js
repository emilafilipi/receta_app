// server/controllers/userController.js
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const userController = {
  updateProfile: async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Update profile request:', {
      body: req.body,
      file: req.file
    });

    // Verify user exists
    const [existingUser] = await pool.execute(
      'SELECT * FROM perdoruesit WHERE perdoruesi_id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateFields = [];
    let updateValues = [];

    // Handle basic fields
    if (req.body.emer_perdoruesi) {
      updateFields.push('emer_perdoruesi = ?');
      updateValues.push(req.body.emer_perdoruesi);
    }
    if (req.body.email) {
      updateFields.push('email = ?');
      updateValues.push(req.body.email);
    }

    // Handle new profile picture
    if (req.file) {
      updateFields.push('foto_profili = ?');
      const imagePath = `/uploads/profile-pictures/${req.file.filename}`;
      updateValues.push(imagePath);
    }

    // Handle password update
    if (req.body.newPassword && req.body.currentPassword) {
      const isValidPassword = await bcrypt.compare(
        req.body.currentPassword,
        existingUser[0].fjalekalimi_hash
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(req.body.newPassword, salt);
      updateFields.push('fjalekalimi_hash = ?');
      updateValues.push(newPasswordHash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add user ID to values array
    updateValues.push(userId);

    // Construct and execute update query
    const updateQuery = `
      UPDATE perdoruesit 
      SET ${updateFields.join(', ')} 
      WHERE perdoruesi_id = ?
    `;

    await pool.execute(updateQuery, updateValues);

    // Fetch updated user data
    const [updatedUser] = await pool.execute(
      'SELECT perdoruesi_id, emer_perdoruesi, email, foto_profili, roli FROM perdoruesit WHERE perdoruesi_id = ?',
      [userId]
    );

    // Format response
    const userResponse = {
      id: updatedUser[0].perdoruesi_id,
      emer_perdoruesi: updatedUser[0].emer_perdoruesi,
      email: updatedUser[0].email,
      role: updatedUser[0].roli,
      foto_profili: updatedUser[0].foto_profili ? `http://localhost:5000${updatedUser[0].foto_profili}` : null
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

};

module.exports = userController;