# Access Control (Roles & Permissions) — Full-Stack RBAC

Enterprise Role-Based Access Control (RBAC) web application featuring a modern React frontend and a robust Node.js, Express, MongoDB, and Mongoose backend.

---

## 🎨 Color Palette

Designed strictly with the designated enterprise palette:
- **Light Background**: `#EEF5FF`
- **Soft Blue**: `#B4D4FF`
- **Medium Blue**: `#86B6F6`
- **Deep Teal Blue**: `#176B87`

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, React Router 7, Tailwind CSS, Vanilla CSS
- **Backend**: Node.js (ESM), Express.js, Mongoose 8
- **Database**: MongoDB (Local or Atlas)
- **Linter & Bundler**: Oxlint, Vite Production Bundler

---

## 📁 Project Structure

```
access-control/
├── server/                       # Node.js + Express + MongoDB Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Mongoose connection & lifecycle events
│   │   ├── controllers/
│   │   │   ├── roleController.js       # Role CRUD, clone, status toggle
│   │   │   └── permissionController.js # Module matrix & permissions
│   │   ├── data/
│   │   │   └── seedData.js      # Automatic initial seed dataset
│   │   ├── middleware/
│   │   │   ├── auth.js          # Security boundary & administrative hooks
│   │   │   └── errorHandler.js  # Centralized JSON error format
│   │   ├── models/
│   │   │   └── Role.js          # Mongoose schema with validations & indexes
│   │   ├── routes/
│   │   │   ├── roleRoutes.js    # /api/roles endpoints
│   │   │   └── permissionRoutes.js # /api/permissions endpoints
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point & auto-seeder
│   ├── .env.example             # Example environment variables
│   ├── package.json             # Backend dependencies & scripts
│   └── test-api.js              # Automated REST API verification suite
│
├── src/                          # React Frontend Application
│   ├── components/
│   │   ├── layout/              # Sidebar, TopNavbar, DashboardLayout
│   │   └── roles/               # Slide-over forms, detail panels, dialogs
│   ├── data/
│   │   ├── permissions.js       # Module definitions & fallback metadata
│   │   └── roles.js             # Initial mock data definitions
│   ├── pages/
│   │   ├── Overview.jsx         # Executive metrics & distribution
│   │   ├── Roles.jsx            # Role Management (connected to MongoDB)
│   │   ├── PermissionMatrix.jsx # Permission Matrix (connected to MongoDB)
│   │   ├── ApprovalLevels.jsx   # Multi-tier authorization matrix
│   │   └── Settings.jsx         # System preferences & security policy
│   ├── services/
│   │   └── api.js               # Frontend HTTP client service for backend APIs
│   ├── styles/                  # Organized CSS stylesheets & design tokens
│   ├── App.jsx                  # Main routing configuration
│   └── main.jsx                 # Application entry point
│
├── package.json                 # Root package configuration
├── vite.config.js               # Vite config with backend proxy (/api -> :5000)
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

### 2. Backend Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if your MongoDB URI differs:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/access_control_rbac
   CLIENT_URL=http://localhost:5173,http://localhost:5174
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
   *Note: On first startup, the server automatically seeds the 7 default financial roles and realistic permission matrix into MongoDB if empty.*

### 3. Frontend Setup
1. In the project root folder:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5174` (or port indicated by Vite).

### 4. Running the API Verification Test Suite
With the backend server running, execute:
```bash
npm run server:test
```
or from the `server/` directory:
```bash
node test-api.js
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | Public |
| `GET` | `/api/roles` | List all roles (supports `?q=`, `?status=`, `?branchScope=`) | Public |
| `GET` | `/api/roles/:id` | Retrieve single role by ID | Public |
| `POST` | `/api/roles` | Create new custom role | Admin |
| `PUT` | `/api/roles/:id` | Update existing role details | Admin |
| `PATCH` | `/api/roles/:id/status` | Toggle or set status (`ACTIVE` / `INACTIVE`) | Admin |
| `POST` | `/api/roles/:id/clone` | Clone existing role and permissions | Admin |
| `DELETE`| `/api/roles/:id` | Permanent delete rejected (returns 405; instructs to deactivate) | Admin |
| `GET` | `/api/permissions` | Get module metadata, action list, and aggregated matrix | Public |
| `PUT` | `/api/roles/:id/permissions` | Update granular permissions for a role | Admin |

---

## 🔒 Security & RBAC Enforcement Rules

1. **Unique Role Names**: Role names are strictly unique (enforced with case-insensitive collation indexes and controller validation).
2. **System Administrator Protection**: The protected `System Administrator` role cannot be deactivated or deleted, ensuring system recovery is always guaranteed.
3. **Minimum Active Admin Rule**: The system guarantees that at least one active System Administrator exists at all times.
4. **Inactive Role Reassignment**: Inactive roles cannot be assigned to users. Attempting to deactivate a role with active assigned users is rejected until users are reassigned.
5. **No Permanent Deletion**: Permanent role deletion is disabled to preserve audit trails and regulatory compliance; status deactivation is enforced instead.
6. **Administrative Route Separation**: All mutation endpoints are tagged with administrative middleware (`requireAdminAuth`), cleanly isolating public demo views and preparing the application for token/OAuth authentication in future phases.
