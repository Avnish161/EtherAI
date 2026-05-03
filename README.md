# Etharaai - Project Management Platform 🚀

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://localhost:3000)

## 🌟 Features
- **Full-Stack SPA**: Node.js/Express + Vanilla JS + SQLite
- **Role-Based Access Control**: Admin/Member permissions
- **Kanban Task Board**: Todo → In Progress → Review → Done
- **Project Management**: Create, members, task assignment
- **Dashboard Stats**: Projects, tasks, progress charts
- **Responsive UI**: Dark theme, glassmorphism, mobile-first
- **JWT Auth**: Secure login/register with bcrypt

## 📱 Quick Start

### Prerequisites
- Node.js 18+

### 1. Clone & Install
```bash
git clone <repo>
cd Etharaai
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Server: http://localhost:3000

### 3. Test Login
```
Email: fresh-1777807721089@test.com
Password: 123456
Role: Admin
```

## 🎮 Usage
1. **Login** → Dashboard overview
2. **Create Project** → Add members
3. **Kanban Board** → Task CRUD, status update
4. **RBAC** → Admins manage all, Members own tasks

## 🛠 Tech Stack
```
Frontend: Vanilla JS, CSS3 (dark theme)
Backend: Express.js, SQLite3, JWT, bcrypt
Validation: express-validator
Dev: nodemon
```

## 📁 File Structure
```
├── public/
│   ├── index.html (SPA entry)
│   ├── css/style.css (dark theme)
│   └── js/ (app.js, auth.js, dashboard.js...)
├── server/
│   ├── database.js (SQLite schema)
│   ├── middleware/auth.js (JWT/RBAC)
│   └── routes/ (auth.js, projects.js...)
├── package.json (deps & scripts)
├── TODO.md (completion checklist) ✅
└── SPEC.md (full requirements)
```

## 🔧 Scripts
```bash
npm run dev     # Development with hot reload
npm start       # Production
npm install     # Dependencies
```

## 🧪 Test User
```
Email: fresh-1777807721089@test.com
Password: 123456
Role: Admin (full access)
```

## 📖 API Endpoints
See SPEC.md for complete REST API docs.

## 🎨 UI/UX
- Dark theme with CSS variables
- Glassmorphism effects
- Responsive grid + mobile nav
- Smooth animations/transitions

## 🔒 Security
- JWT tokens (7d expiry)
- Password hashing (bcrypt)
- Input validation (express-validator)
- SQL injection prevention

## 📈 Database Schema
See `server/database.js` or SPEC.md

## 🤝 Contributing
1. Fork repository
2. `npm install`
3. Create feature branch
4. `npm run dev`
5. PR to main

## 📄 License
MIT License - see LICENSE file
