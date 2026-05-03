# Etharaai - Project Management Web Application

## Project Overview
- **Project Name**: Etharaai
- **Type**: Full-stack Web Application (REST API + Frontend)
- **Core Functionality**: A project management platform where users can create projects, assign tasks, track progress with role-based access control (Admin/Member)
- **Target Users**: Teams and organizations needing project/task management

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) - NoSQL like document storage
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: express-validator

### Frontend
- **Type**: Single Page Application
- **Framework**: Vanilla JavaScript with modern ES6+
- **Styling**: Custom CSS with CSS variables
- **HTTP Client**: Fetch API

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

### Project Members Table
```sql
CREATE TABLE project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(project_id, user_id)
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assigned_to INTEGER,
  due_date DATE,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## REST API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users (admin only) |
| GET | /api/users/:id | Get user by ID |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member to project |
| DELETE | /api/projects/:id/members/:userId | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:projectId/tasks | Get project tasks |
| POST | /api/projects/:projectId/tasks | Create task |
| GET | /api/tasks/:id | Get task details |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PUT | /api/tasks/:id/status | Update task status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Get dashboard statistics |

---

## Role-Based Access Control

### Permissions
| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Delete own project | ✅ | ✅ |
| Delete any project | ✅ | ❌ |
| Add members to project | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Create task | ✅ | ✅ |
| Update any task in project | ✅ | ❌ |
| Update own tasks | ✅ | ✅ |
| Delete task | ✅ (project) | ✅ (own only) |
| View dashboard | ✅ | ✅ (limited) |
| View all users | ✅ | ❌ |

---

## UI/UX Specification

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  
  /* Secondary Colors */
  --secondary: #10b981;
  --secondary-light: #34d399;
  
  /* Accent Colors */
  --accent: #f59e0b;
  --accent-light: #fbbf24;
  
  /* Neutral Colors */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Status Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Priority Colors */
  --priority-high: #ef4444;
  --priority-medium: #f59e0b;
  --priority-low: #22c55e;
  
  /* Task Status Colors */
  --status-todo: #64748b;
  --status-in-progress: #3b82f6;
  --status-review: #f59e0b;
  --status-done: #22c55e;
}
```

### Typography
- **Primary Font**: 'Outfit', sans-serif
- **Monospace Font**: 'JetBrains Mono', monospace
- **Heading Sizes**: h1: 2.5rem, h2: 2rem, h3: 1.5rem, h4: 1.25rem
- **Body Size**: 1rem (16px)
- **Small Text**: 0.875rem (14px)

### Layout
- **Max Content Width**: 1400px
- **Sidebar Width**: 260px
- **Border Radius**: small: 6px, medium: 10px, large: 16px
- **Spacing Scale**: 4px base

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## Page Structure

### 1. Login Page
- Centered card layout
- Logo at top
- Email and password fields
- Submit button
- Register link

### 2. Register Page
- Same layout as login
- Additional name field
- Role selector (for demo)
- Login link

### 3. Dashboard Page
- Sidebar navigation
- Header with user info and logout
- Statistics cards (4 columns):
  - Total Projects
  - Total Tasks
  - Tasks In Progress
  - Overdue Tasks
- Recent activity section
- Quick access to projects

### 4. Projects Page
- Project cards grid
- Create project button
- Project cards showing:
  - Project name
  - Description
  - Member count
  - Task progress bar
  - Action buttons

### 5. Project Detail Page
- Project header with info
- Tabs: Tasks | Members | Settings
- Task board (Kanban style)
- Task columns: To Do, In Progress, Review, Done
- Task cards with:
  - Title
  - Priority badge
  - Assignee avatar
  - Due date
  - Status dropdown

### 6. Task Detail Modal
- Task title (editable)
- Description textarea
- Status dropdown
- Priority dropdown
- Assignee dropdown
- Due date picker
- Created by info
- Save/Cancel buttons

---

## Visual Effects

### Animations
- Page transitions: fade-in 0.3s ease
- Card hover: translateY(-4px) with shadow
- Button hover: brightness(1.1)
- Modal: scale from 0.95 with opacity
- Sidebar: slide in from left

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
```

### Glassmorphism
- Background blur on sidebar
- Subtle gradient overlays
- Border with transparency

---

## Acceptance Criteria

1. ✅ User can register with name, email, password
2. ✅ User can login and receive JWT token
3. ✅ User can create new projects
4. ✅ User can add members to projects (admin only)
5. ✅ User can create tasks within projects
6. ✅ User can assign tasks to project members
7. ✅ User can update task status
8. ✅ User can view dashboard with statistics
9. ✅ Admin can manage all aspects
10. ✅ Member has limited access as per RBAC
11. ✅ UI is responsive and visually appealing
12. ✅ All API endpoints are properly validated
13. ✅ Password is hashed before storage
14. ✅ JWT authentication is implemented

---

## File Structure

```
Etharaai/
├── SPEC.md
├── package.json
├── server/
│   ├── index.js
│   ├── database.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── projects.js
│       ├── tasks.js
│       └── dashboard.js
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── api.js
        ├── auth.js
        ├── projects.js
        ├── tasks.js
        ├── dashboard.js
        └── utils.js
