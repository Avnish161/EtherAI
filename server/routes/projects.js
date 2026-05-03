const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { auth, checkProjectAccess, checkProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all projects for current user
router.get('/', auth, (req, res) => {
  try {
    const userId = req.user.id;
    
    const projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      ) OR p.owner_id = ?
      ORDER BY p.created_at DESC
    `).all(userId, userId);
    
    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const ownerId = req.user.id;

    const result = db.prepare(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
    ).run(name, description || null, ownerId);

    // Add owner as project admin
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, ownerId, 'admin');

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: result.lastInsertRowid,
        name,
        description,
        owner_id: ownerId
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', auth, checkProjectAccess, (req, res) => {
  try {
    const { id } = req.params;

    const project = db.prepare(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project members
    const members = db.prepare(`
      SELECT pm.id, pm.user_id, pm.role, u.name, u.email
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    // Get task stats
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks WHERE project_id = ?
    `).get(id);

    res.json({ project, members, taskStats });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, checkProjectAdmin, [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, checkProjectAdmin, (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', auth, checkProjectAdmin, [
  body('userId').isInt().withMessage('User ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { userId, role } = req.body;

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, userId);

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(id, userId, role || 'member');

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', auth, checkProjectAdmin, (req, res) => {
  try {
    const { id, userId } = req.params;

    // Can't remove project owner
    const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(id);
    if (project.owner_id === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    db.prepare(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
    ).run(id, userId);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project members
router.get('/:id/members', auth, checkProjectAccess, (req, res) => {
  try {
    const { id } = req.params;

    const members = db.prepare(`
      SELECT pm.id, pm.user_id, pm.role, u.name, u.email
      FROM project_members pm
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
