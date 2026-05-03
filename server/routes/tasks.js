const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { auth, checkProjectAccess, checkProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a project
router.get('/project/:projectId', auth, checkProjectAccess, (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email,
        c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = ?
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.created_at DESC
    `).all(projectId);

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/project/:projectId', auth, checkProjectAccess, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional(),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('assignedTo').optional().isInt().withMessage('Invalid assignee'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    // Verify assignee is a project member if provided
    if (assignedTo) {
      const member = db.prepare(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(projectId, assignedTo);
      
      if (!member) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (project_id, title, description, priority, assigned_to, due_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      title,
      description || null,
      priority || 'medium',
      assignedTo || null,
      dueDate || null,
      req.user.id
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;

    const task = db.prepare(`
      SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email,
        c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the project
    const member = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, [
  body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty'),
  body('description').optional(),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('assignedTo').optional().isInt().withMessage('Invalid assignee'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access - must be project member or admin
    const member = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Non-admin members can only update their own tasks
    if (req.user.role !== 'admin' && member.role !== 'admin') {
      if (task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own tasks' });
      }
    }

    // Verify assignee is a project member if provided
    if (assignedTo) {
      const newMember = db.prepare(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(task.project_id, assignedTo);
      
      if (!newMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assignedTo || null);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate || null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task status
router.put('/:id/status', auth, [
  body('status').isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const member = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare(`
      UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({
      message: 'Task status updated',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access - must be project member or admin
    const member = db.prepare(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);

    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only admin members or task creator can delete
    if (req.user.role !== 'admin' && member.role !== 'admin' && task.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only task creator or project admin can delete' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
