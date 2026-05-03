const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Etharaai Server Running                           ║
║                                                       ║
║   Local:    http://localhost:${PORT}                      ║
║   API:      http://localhost:${PORT}/api                 ║
║                                                       ║
║   Press Ctrl+C to stop the server                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
