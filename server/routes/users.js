const express = require('express');
const db = require('../database');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC
    `).all();
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users (for assigning to projects)
router.get('/search/:query', auth, (req, res) => {
  try {
    const { query } = req.params;
    
    const users = db.prepare(`
      SELECT id, name, email FROM users 
      WHERE name LIKE ? OR email LIKE ?
      LIMIT 10
    `).all(`%${query}%`, `%${query}%`);
    
    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    
    // Only admins can view other users
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = db.prepare(`
      SELECT id, name, email, role, created_at FROM users WHERE id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
