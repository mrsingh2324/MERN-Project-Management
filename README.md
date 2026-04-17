# CollabTrack — Project Collaboration & Issue Tracking System

A full-stack MERN application for team project management, issue tracking, and progress monitoring.

---

## 🗂 Project Structure

```
project-collab-system/
├── backend/               # Node.js + Express API
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
└── frontend/              # React.js app
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── api.js
        └── App.js
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- npm

---

### Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your settings:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/project_collab
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

Start backend:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Backend runs at: `http://localhost:5000`

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

> The `proxy` field in `frontend/package.json` is set to `http://localhost:5000` so API calls work without CORS issues in development.

---

## 👤 Sample Credentials

Register users manually through the app, or seed the DB. Suggested test accounts:

| Name          | Email              | Password    | Role   |
|---------------|--------------------|-------------|--------|
| Admin User    | admin@demo.com     | password123 | admin  |
| Team Member   | member@demo.com    | password123 | member |

---

## 🔑 Features

### Authentication
- JWT-based login/register
- Role-based access control (Admin / Member)
- Protected routes on frontend and backend

### Project Manager (Admin)
- Create, view, edit, delete projects
- Assign team members to projects
- Create and assign issues/tasks
- Full dashboard with stats
- View all issues with filters

### Team Member
- View assigned projects and tasks
- Update issue status (own tasks only)
- Add work notes/comments
- Personal dashboard with task summary

### Filtering & Search
- Filter issues by: status, priority, project, assigned member
- Search projects and issues by title
- Overdue task highlighting

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Get all users (admin) |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (admin) |
| GET | `/api/projects/dashboard` | Dashboard stats |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List issues (with filters) |
| POST | `/api/issues` | Create issue (admin) |
| GET | `/api/issues/:id` | Get issue |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue (admin) |
| POST | `/api/issues/:id/comments` | Add comment |

---

## 🗃 MongoDB Collections

- **users** — name, email, hashed password, role
- **projects** — title, description, dates, status, manager ref, members refs
- **issues** — title, description, project ref, assignedTo ref, priority, status, dueDate, comments[]

---

## 🛠 Tech Stack

- **Frontend:** React.js, React Router v6, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcryptjs
