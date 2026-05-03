const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'etharaai-secret-key-2024';

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const checkProjectAccess = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  const member = db.prepare(`
    SELECT * FROM project_members 
    WHERE project_id = ? AND user_id = ?
  `).get(projectId, userId);
  
  if (!member) {
    return res.status(403).json({ error: 'Access denied to this project' });
  }
  
  req.projectMember = member;
  next();
};

const checkProjectAdmin = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;
  

  if (req.user.role === 'admin') {
    return next();
  }
  
  const member = db.prepare(`
    SELECT * FROM project_members 
    WHERE project_id = ? AND user_id = ? AND role = 'admin'
  `).get(projectId, userId);
  
  if (!member) {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  
  req.projectMember = member;
  next();
};

module.exports = {
  auth,
  requireAdmin,
  checkProjectAccess,
  checkProjectAdmin,
  JWT_SECRET
};
