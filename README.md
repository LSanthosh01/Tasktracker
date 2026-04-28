# ⚡ TaskTrack — Full Stack Task Manager with RBAC

A complete, production-ready task management system with role-based access control built with React.js, Node.js/Express, and MongoDB.

---

## 🏗️ Architecture

```
tasktrack/
├── backend/              # Node.js + Express REST API
│   ├── models/           # Mongoose schemas (User, Task, Report, Rating)
│   ├── routes/           # Express route handlers
│   ├── middleware/        # JWT auth + RBAC middleware
│   ├── server.js         # Entry point
│   └── .env.example      # Environment variables template
│
└── frontend/             # React.js SPA
    └── src/
        ├── context/      # Auth context (JWT state management)
        ├── pages/        # Dashboard, Tasks, Reports, Ratings, Users, Profile
        ├── components/   # Reusable components (Layout, Sidebar)
        └── utils/        # Axios API client
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone and install
```bash
git clone <your-repo>
cd tasktrack
npm run install:all
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your values:
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tasktrack
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET=tasktrack-admin-2024   # Change this!
NODE_ENV=development
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# Edit .env:
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run both servers

Terminal 1 (Backend):
```bash
cd backend && npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend && npm start
```

Open http://localhost:3000

---

## 👥 Roles & Permissions

| Permission            | Admin | Manager | Employee |
|-----------------------|-------|---------|----------|
| View Dashboard        | ✅    | ✅      | ✅       |
| Create Tasks          | ✅    | ✅      | ❌       |
| Assign to Managers    | ✅    | ❌      | ❌       |
| Assign to Employees   | ✅    | ✅      | ❌       |
| Update Task Status    | ✅    | ✅      | ✅ (own) |
| Delete Tasks          | ✅    | ✅ (own)| ❌       |
| Create Users          | ✅    | ✅      | ❌       |
| Create Managers       | ✅    | ❌      | ❌       |
| Delete Users          | ✅    | ✅      | ❌       |
| Submit Reports        | ✅    | ✅      | ✅       |
| Review Reports        | ✅    | ✅      | ❌       |
| View All Reports      | ✅    | ✅      | ❌       |
| Give Ratings          | ✅    | ✅      | ✅       |
| View All Ratings      | ✅    | ✅      | ✅       |

---

## 🔐 Authentication Flow

1. **Admin Registration**: `POST /api/auth/register` requires `adminSecret`
2. **Login**: `POST /api/auth/login` returns JWT token
3. **Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Token expiry**: 7 days (configurable)

### Create your first admin account
Visit `/register` and enter the admin secret key (default: `tasktrack-admin-2024`)

---

## 📡 API Reference

### Auth
| Method | Endpoint                   | Access  | Description          |
|--------|----------------------------|---------|----------------------|
| POST   | /api/auth/register         | Public  | Register admin        |
| POST   | /api/auth/login            | Public  | Login                |
| GET    | /api/auth/me               | Auth    | Get current user     |
| PUT    | /api/auth/change-password  | Auth    | Change password      |

### Users
| Method | Endpoint        | Access         | Description     |
|--------|-----------------|----------------|-----------------|
| GET    | /api/users      | Admin/Manager  | List users      |
| GET    | /api/users/:id  | Auth           | Get user        |
| POST   | /api/users      | Admin/Manager  | Create user     |
| PUT    | /api/users/:id  | Admin/Manager  | Update user     |
| DELETE | /api/users/:id  | Admin/Manager  | Delete user     |

### Tasks
| Method | Endpoint        | Access         | Description         |
|--------|-----------------|----------------|---------------------|
| GET    | /api/tasks      | Auth           | List tasks (filtered)|
| GET    | /api/tasks/:id  | Auth           | Get task            |
| POST   | /api/tasks      | Admin/Manager  | Create task         |
| PUT    | /api/tasks/:id  | Auth (partial) | Update task         |
| DELETE | /api/tasks/:id  | Admin/Manager  | Delete task         |

### Reports
| Method | Endpoint                | Access        | Description       |
|--------|-------------------------|---------------|-------------------|
| GET    | /api/reports            | Auth          | List reports      |
| GET    | /api/reports/:id        | Auth          | Get report        |
| POST   | /api/reports            | Auth          | Submit report     |
| PUT    | /api/reports/:id/review | Admin/Manager | Review report     |
| DELETE | /api/reports/:id        | Auth          | Delete report     |

### Ratings
| Method | Endpoint          | Access  | Description          |
|--------|-------------------|---------|----------------------|
| GET    | /api/ratings      | Auth    | Get ratings          |
| GET    | /api/ratings/summary | Auth | Team rating summary  |
| POST   | /api/ratings      | Auth    | Submit rating        |
| DELETE | /api/ratings/:id  | Auth    | Delete rating        |

---

## 🚢 Deployment

### Backend → Render.com

1. Push backend to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, select the `backend` folder
4. Set environment variables from `.env.example`
5. Deploy! Your API will be at `https://your-app.onrender.com`

### Frontend → Vercel

1. Push frontend to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo, set root directory to `frontend`
4. Add environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com/api`
5. Deploy! Your app will be at `https://your-app.vercel.app`

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → Add New Site
2. Connect GitHub, set publish directory to `frontend/build`
3. Add build command: `cd frontend && npm run build`
4. Set env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

---

## 🗄️ Database Schema

### Users Collection
```js
{
  name: String,       email: String (unique),
  password: String,   role: 'admin'|'manager'|'employee',
  department: String, isActive: Boolean,
  createdBy: ObjectId, createdAt, updatedAt
}
```

### Tasks Collection
```js
{
  title: String,      description: String,
  assignedBy: UserId, assignedTo: UserId,
  deadline: Date,     status: 'pending'|'in-progress'|'completed',
  priority: 'low'|'medium'|'high',
  tags: [String],     completedAt: Date
}
```

### Reports Collection
```js
{
  submittedBy: UserId, date: Date,
  tasksWorkedOn: [{ task: TaskId, taskTitle: String }],
  progressDescription: String, hoursWorked: Number,
  status: 'submitted'|'reviewed'|'approved',
  reviewedBy: UserId, reviewNotes: String
}
```

### Ratings Collection
```js
{
  ratedBy: UserId,    ratedUser: UserId,
  score: Number(1-5), feedback: String,
  category: 'overall'|'performance'|'teamwork'|'communication'|'technical',
  period: String ('2024-01')
}
```

---

## 🎨 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, React Router 6          |
| State      | React Context API                 |
| HTTP       | Axios with interceptors           |
| Styling    | Pure CSS with CSS variables       |
| Fonts      | Syne (display) + DM Sans (body)   |
| Icons      | Lucide React                      |
| Toasts     | react-hot-toast                   |
| Backend    | Node.js + Express 4               |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT (jsonwebtoken) + bcryptjs     |
| Validation | express-validator                 |
| Deployment | Vercel (FE) + Render (BE)         |

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Role-based middleware on all protected routes
- Input validation with express-validator
- CORS configured for specific frontend origin
- Automatic token refresh handling in frontend
- Admin secret required for admin registration

---

## 💡 Development Tips

- Use the demo accounts buttons on the login page to quickly test different roles
- MongoDB Compass is useful for inspecting the database during development  
- The backend runs on port 5000, frontend on 3000 by default
- React proxy in package.json forwards `/api` calls to backend during development

---

*Built with ⚡ by TaskTrack — A production-ready RBAC Task Manager*
