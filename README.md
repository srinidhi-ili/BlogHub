# 📝 BlogSpace — Blog Publishing Platform

A modern, full-stack blog publishing platform built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**. Writers can create, edit, save drafts, publish articles, and manage their content. Readers can explore, search, and comment on published posts.

> **College Project** — B.Tech CSE, Blog Publishing Platform

---

## 🚀 Features

### For Readers
- Browse published articles on a clean, responsive home page
- Search articles by title and content
- Filter by category (Technology, Lifestyle, Education, etc.)
- Sort by newest or oldest
- Read full articles with comments
- Discover related articles

### For Writers (Authenticated Users)
- Create new blog posts with title, summary, content, and category
- Save articles as **drafts** or **publish** immediately
- Live word count and summary character counter
- Preview posts before publishing
- Edit and delete your own posts
- Personal dashboard with post statistics
- Comment on published articles

### For Administrators
- Admin dashboard with platform-wide statistics
- Manage all users, posts, and comments
- Remove inappropriate content
- Role-based access control enforced on the backend

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js, React Router, Axios, React Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), bcrypt.js |
| **Styling** | Custom CSS (no UI frameworks) |

---

## 📁 Project Structure

```
BLOG-PUBLISH.01/
├── backend/                          # Express.js API Server
│   ├── config/
│   │   └── db.js                     # MongoDB connection setup
│   ├── controllers/
│   │   ├── adminController.js        # Admin operations (stats, user/post/comment management)
│   │   ├── authController.js         # Register, login, get current user
│   │   ├── commentController.js      # CRUD for comments
│   │   └── postController.js         # CRUD for blog posts
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification & role-based authorization
│   │   └── errorHandler.js           # Centralized error handling
│   ├── models/
│   │   ├── Comment.js                # Comment schema
│   │   ├── Post.js                   # Post schema (draft/published)
│   │   └── User.js                   # User schema (bcrypt + JWT)
│   ├── routes/
│   │   ├── admin.js                  # Admin API routes
│   │   ├── auth.js                   # Auth API routes
│   │   ├── comments.js               # Comment API routes
│   │   └── posts.js                  # Post API routes
│   ├── server.js                     # Entry point
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── frontend/                         # React.js Application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── blog/
│   │   │   │   └── PostCard.js       # Reusable blog post card
│   │   │   └── common/
│   │   │       ├── AdminRoute.js     # Admin-only route guard
│   │   │       ├── Alert.js          # Toast notifications
│   │   │       ├── LoadingSpinner.js # Loading indicator
│   │   │       ├── Navbar.js         # Responsive navigation bar
│   │   │       └── ProtectedRoute.js # Auth route guard
│   │   ├── context/
│   │   │   └── AuthContext.js        # Global authentication state
│   │   ├── pages/
│   │   │   ├── AdminDashboard.js     # Admin panel
│   │   │   ├── BlogDetail.js         # Full article view + comments
│   │   │   ├── CreatePost.js         # Post editor (create)
│   │   │   ├── EditPost.js           # Post editor (edit)
│   │   │   ├── Explore.js            # Browse all published posts
│   │   │   ├── Home.js               # Landing page
│   │   │   ├── Login.js              # Login form
│   │   │   ├── MyBlogs.js            # User dashboard
│   │   │   ├── NotFound.js           # 404 page
│   │   │   └── Register.js           # Registration form
│   │   ├── services/
│   │   │   └── api.js                # Axios instance with interceptors
│   │   └── styles/                   # CSS files for each component/page
│   ├── .env                          # Frontend environment config
│   └── package.json
│
└── README.md                         # This file
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** (v16 or higher) — [Download](https://nodejs.org/)
- **MongoDB** (local or Atlas) — [Download](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/atlas)
- **Git** (optional)

### 1. Clone or Download the Project

```bash
cd BLOG-PUBLISH.01
```

### 2. Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file (copy from example)
copy .env.example .env
```

Edit `backend/.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog-platform
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

> **Important:** Change `JWT_SECRET` to a strong, random string in production.

> **For MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/blog-platform`

### 3. Setup Frontend

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

The frontend `.env` file is pre-configured:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the Application

**Terminal 1 — Start Backend:**
```bash
cd backend
npm run dev
```
You should see:
```
[Server] Blog Platform API running in development mode on port 5000
[Database] MongoDB connected: localhost
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm start
```
The React app opens at `http://localhost:3000`

### 5. Create an Admin User

Register a normal user through the UI, then promote them to admin via MongoDB shell:

```bash
# Using MongoDB shell (mongosh)
mongosh
use blog-platform
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Or if using MongoDB Atlas, use the Atlas UI to edit the user document.

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/me` | Get current user | ✅ |

**Register Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Auth Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64a...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Post Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/posts` | Get all published posts | ❌ |
| GET | `/posts/:id` | Get single post | ❌ |
| GET | `/posts/my-posts` | Get user's own posts | ✅ |
| POST | `/posts` | Create new post | ✅ |
| PUT | `/posts/:id` | Update post | ✅ (owner) |
| DELETE | `/posts/:id` | Delete post | ✅ (owner) |

**Query Parameters for GET `/posts`:**
- `search` — Search in title and content
- `category` — Filter by category
- `sort` — `newest` (default) or `oldest`
- `page` — Page number (default: 1)
- `limit` — Posts per page (default: 10)

**Create Post Request Body:**
```json
{
  "title": "My First Blog Post",
  "summary": "A brief description of this post",
  "content": "Full article content goes here...",
  "category": "Technology",
  "status": "published"
}
```

**Categories:** Technology, Lifestyle, Education, Health, Travel, Food, Sports, Entertainment, Science, Other

### Comment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/posts/:id/comments` | Get comments for a post | ❌ |
| POST | `/posts/:id/comments` | Add comment to a post | ✅ |
| DELETE | `/comments/:id` | Delete a comment | ✅ (owner/admin) |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Get platform statistics | ✅ Admin |
| GET | `/admin/users` | List all users | ✅ Admin |
| DELETE | `/admin/users/:id` | Delete a user | ✅ Admin |
| DELETE | `/admin/posts/:id` | Delete any post | ✅ Admin |
| DELETE | `/admin/comments/:id` | Delete any comment | ✅ Admin |

### Authentication Header
For protected routes, include the JWT token:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Security Features

- **Password Hashing** — All passwords hashed with bcrypt (10 salt rounds)
- **JWT Authentication** — Stateless token-based auth with configurable expiry
- **Route Protection** — Backend middleware verifies tokens on protected routes
- **Role-Based Access Control** — Admin routes restricted with `authorize('admin')` middleware
- **Ownership Verification** — Users can only edit/delete their own posts and comments
- **Input Validation** — Server-side validation on all request bodies
- **CORS Configuration** — Only allowed origins can access the API
- **No Plain-Text Secrets** — Environment variables for all sensitive data
- **Select: false** — Password field excluded from queries by default

---

## 🗄️ Database Models

### User
| Field | Type | Description |
|-------|------|-------------|
| name | String | Required, trimmed, max 50 chars |
| email | String | Required, unique, validated format |
| password | String | Required, min 6 chars, hashed, hidden from queries |
| role | String | 'user' or 'admin' (default: 'user') |
| createdAt | Date | Auto-generated |

### Post
| Field | Type | Description |
|-------|------|-------------|
| title | String | Required, trimmed |
| summary | String | Required, max 300 chars |
| content | String | Required |
| category | String | Required, from predefined list |
| author | ObjectId | Reference to User |
| status | String | 'draft' or 'published' (default: 'draft') |
| createdAt | Date | Auto-generated |
| updatedAt | Date | Auto-updated on save |
| publishedAt | Date | Set when status becomes 'published' |

### Comment
| Field | Type | Description |
|-------|------|-------------|
| content | String | Required, max 1000 chars |
| author | ObjectId | Reference to User |
| post | ObjectId | Reference to Post |
| createdAt | Date | Auto-generated |

---

## 🧪 Testing with Postman

1. Import the API endpoints listed above into Postman
2. Start with `POST /api/auth/register` to create a user
3. Copy the `token` from the response
4. Set `Authorization: Bearer <token>` header for protected routes
5. Test creating, updating, and deleting posts
6. Test commenting on posts
7. Promote a user to admin in MongoDB and test admin endpoints

---

## 📱 Responsive Design

The application is fully responsive:
- **Desktop** (>1024px): Full layout with 3-column post grid
- **Tablet** (768–1024px): 2-column grid, adjusted spacing
- **Mobile** (<768px): Single column, hamburger navigation menu

---

## 🎓 Key Concepts for Viva

1. **MERN Stack** — MongoDB, Express.js, React.js, Node.js
2. **REST API** — Stateless HTTP endpoints (GET, POST, PUT, DELETE)
3. **JWT Authentication** — Token-based stateless auth (vs session-based)
4. **Bcrypt Hashing** — One-way password encryption with salting
5. **React Context API** — Global state management without prop drilling
6. **React Router** — Client-side routing in Single Page Applications
7. **Mongoose ODM** — Object-Document Mapping for MongoDB schemas
8. **Middleware Pattern** — Request processing pipeline in Express
9. **CORS** — Cross-Origin Resource Sharing for frontend-backend communication
10. **Environment Variables** — Secure configuration management

---

## 👤 Authors

Built as a college project for B.Tech CSE.

---

## 📄 License

This project is for educational purposes.
