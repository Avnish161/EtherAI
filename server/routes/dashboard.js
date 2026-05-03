const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/', auth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get projects user is member of
    const projects = db.prepare(`
      SELECT p.id FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
    `).all(userId);

    const projectIds = projects.map(p => p.id);

    let stats = {
      totalProjects: 0,
      totalTasks: 0,
      tasksInProgress: 0,
      tasksDone: 0,
      overdueTasks: 0,
      myTasks: 0,
      myTasksInProgress: 0
    };

    if (projectIds.length > 0) {
      const placeholders = projectIds.map(() => '?').join(',');

      // Total projects
      stats.totalProjects = projectIds.length;

      // Total tasks across all projects
      const taskStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
          SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
        FROM tasks 
        WHERE project_id IN (${placeholders})
      `).get(...projectIds);

      stats.totalTasks = taskStats.total || 0;
      stats.tasksInProgress = taskStats.in_progress || 0;
      stats.tasksDone = taskStats.done || 0;
      stats.overdueTasks = taskStats.overdue || 0;

      // Tasks assigned to current user
      const myTaskStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
        FROM tasks 
        WHERE assigned_to = ? AND project_id IN (${placeholders})
      `).get(userId, ...projectIds);

      stats.myTasks = myTaskStats.total || 0;
      stats.myTasksInProgress = myTaskStats.in_progress || 0;
    }

    // Get recent tasks
    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all(userId);

    // Get my assigned tasks
    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ? AND t.status != 'done'
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC
    `).all(userId);

    res.json({
      stats,
      recentTasks,
      myTasks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
