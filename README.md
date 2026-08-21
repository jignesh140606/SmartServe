# 🚀 SmartServe — Cloud Service Desk & Incident Management Platform

**SmartServe** is a full-stack, enterprise-grade customer support and incident management suite built with **React 19**, **TypeScript**, **Tailwind CSS**, **Node.js / Express**, and **MongoDB Atlas**. It provides role-based workspaces for **Administrators**, **Support Specialists (Employees)**, and **Customers** with automated status tracking, triage feeds, and strict server-side RBAC enforcement.

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Access Control (RBAC)
- **Admin**: Full visibility over system health, staff provisioning, customer directories, global ticket/complaint queues, and engineer assignments.
- **Support Specialist (Employee)**: Scoped work queue displaying assigned tickets and complaints, urgent SLA attention feeds, and one-click status transitions.
- **Customer**: Dedicated portal to submit service tickets, file formal complaints, track resolution progress, and edit open requests prior to assignment.

### 2. 📋 Service Tickets & Complaint Suites
- **Symmetric Lifecycle Architecture**: Full CRUD support with priority weights (`Critical`, `High`, `Medium`, `Low`) and statuses (`Open`, `In Progress`, `Resolved`, `Closed`).
- **Server-Side Security**:
  - Role-scoped endpoint queries (Customers see only own items; Employees see only assigned items; Admins see all).
  - Customer edit-lock prevents modifications once an item is assigned or processed (`400 Bad Request`).
  - Automated status advancement (`Open` &rarr; `In Progress`) upon engineer assignment.

### 3. 🎯 Executive Dashboards & Triage
- **Admin Control Center**:
  - **6-Card Stat Grid**: Total Complaints, Total Tickets, Open Action Items, Resolved Items, Staff Count, and Customer Accounts.
  - **Unassigned Items Triage**: Combined feed of unassigned tickets and complaints sorted by priority urgency and date, with inline assignment dropdowns.
  - **Recent Activity Stream**: Live feed of desk events with relative timestamps (`"Last updated X ago"`).
- **Support Specialist Workspace**:
  - **4 Personal Metric Cards**: Assigned Work Total, Active Handling, Completed Resolutions, and Urgent SLA Items.
  - **Urgent Action Queue**: High and Critical priority queue with direct status update controls.
  - **"My Work" Unified View**: Combined tickets and complaints queue with sorting by priority or activity date.
- **Customer Support Portal**:
  - **Status Breakdown Cards**: Total Submitted, Queued, Under Handling, and Resolved.
  - **"Raise New" Quick Actions**: Quick CTA cards for submitting technical tickets or escalating formal complaints.
  - **Inquiries Snapshot**: Active items feed with specialist assignment tracking.

### 4. 🎨 Light-Theme Design System & Resilience
- **Shared Layout (`SidebarLayout`)**: Collapsible navigation, search bar, role badges, and quick-action buttons across all views.
- **Empty & Loading States**: Skeleton and animated `Loader2` spinners across all tables with descriptive empty-state illustrations.
- **Relative Timestamps**: Human-friendly `"Last updated X ago"` formatting powered by `date-fns`.
- **Global Error Handling**: React `ErrorBoundary` fallback screen and styled `NotFoundPage` (404).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide React, Axios, date-fns, Vite |
| **Backend** | Node.js, Express, TypeScript, Mongoose, JSON Web Tokens (JWT), bcryptjs, CORS |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Dev Tools** | Oxlint, PostCSS, Autoprefixer, Concurrently |

---

## 📁 Project Structure

```text
SmartServe/
├── src/                               # Frontend React Application
│   ├── components/
│   │   ├── auth/                      # ProtectedRoute & Role Guards
│   │   ├── ui/                        # Reusable Light-Theme Component Library
│   │   │   ├── Badge.tsx              # Priority & Status Tag Component
│   │   │   ├── Button.tsx             # Interactive Button with Loading States
│   │   │   ├── Card.tsx               # Metric & Container Cards
│   │   │   ├── Input.tsx              # Validated Form Inputs
│   │   │   ├── Modal.tsx              # Accessible Popover Dialogs
│   │   │   ├── Select.tsx             # Dropdown Selectors
│   │   │   ├── SidebarLayout.tsx      # Unified Navigation Layout & Topbar
│   │   │   ├── Table.tsx              # Data Table Container & Rows
│   │   │   └── Textarea.tsx           # Multi-line Text Inputs
│   │   └── ErrorBoundary.tsx          # Global Runtime Exception Boundary
│   ├── context/
│   │   └── AuthContext.tsx            # JWT State, User Profile & Session Persistence
│   ├── lib/
│   │   └── dateUtils.ts               # date-fns Relative Distance & Priority Weights
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── CustomerManagement.tsx # Customer Directory & Profiles
│   │   │   └── EmployeeManagement.tsx # Staff Provisioning & Activation
│   │   ├── AdminDashboard.tsx         # Executive Admin Center & Triage
│   │   ├── CustomerDashboard.tsx      # Customer Portal & Request Creation
│   │   ├── EmployeeDashboard.tsx      # Specialist Workspace & "My Work"
│   │   ├── LoginPage.tsx              # Authentication Login Screen
│   │   ├── SignupPage.tsx             # Customer Registration Screen
│   │   └── NotFoundPage.tsx           # 404 Route Handler
│   ├── services/
│   │   ├── api.ts                     # Axios Instance with JWT Interceptors
│   │   ├── authService.ts             # Signup, Login, Me Endpoints
│   │   ├── complaintService.ts        # Complaint CRUD API Client
│   │   ├── customerService.ts         # Customer Directory API Client
│   │   ├── employeeService.ts         # Employee Management API Client
│   │   └── ticketService.ts           # Ticket CRUD API Client
│   ├── App.tsx                        # Router Configuration & Role Routes
│   └── main.tsx                       # React Entry Point
│
├── server/                            # Backend Node.js + TypeScript Service
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                  # Mongoose MongoDB Connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts     # Signup, Login, Profile Handlers
│   │   │   ├── complaint.controller.ts# Role-Scoped Complaint Lifecycle
│   │   │   ├── customer.controller.ts # Customer Directory Handlers
│   │   │   ├── employee.controller.ts # Employee Management Handlers
│   │   │   └── ticket.controller.ts   # Role-Scoped Ticket Lifecycle
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts      # JWT Authentication Guard
│   │   │   └── roleMiddleware.ts      # Role-Based Permission Guard
│   │   ├── models/
│   │   │   ├── Complaint.ts           # Complaint Schema
│   │   │   ├── Customer.ts            # Customer Profile Schema
│   │   │   ├── Employee.ts            # Staff Profile Schema
│   │   │   ├── Ticket.ts              # Ticket Schema
│   │   │   └── User.ts                # Base User Account Schema
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # /api/auth
│   │   │   ├── complaint.routes.ts    # /api/complaints
│   │   │   ├── customer.routes.ts     # /api/customers
│   │   │   ├── employee.routes.ts     # /api/employees
│   │   │   └── ticket.routes.ts       # /api/tickets
│   │   └── server.ts                  # Express Application Entry Point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🔌 API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive 7-day JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch authenticated user profile |

### 🎫 Service Tickets (`/api/tickets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets` | Authenticated | Create a service ticket (initial status: `Open`) |
| `GET` | `/api/tickets` | Role-Scoped | Admin: All, Employee: Assigned, Customer: Own |
| `GET` | `/api/tickets/:id` | Role-Scoped | Retrieve single ticket details |
| `PUT` | `/api/tickets/:id` | Customer / Admin | Update ticket (locked for customers once assigned) |
| `PATCH` | `/api/tickets/:id/status` | Employee / Admin | Update status (`Open` &rarr; `In Progress` &rarr; `Resolved` &rarr; `Closed`) |
| `PATCH` | `/api/tickets/:id/assign` | Admin Only | Assign engineer (automatically sets status to `In Progress`) |

### ⚠️ Complaints (`/api/complaints`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | Authenticated | Submit formal complaint |
| `GET` | `/api/complaints` | Role-Scoped | Admin: All, Employee: Assigned, Customer: Own |
| `GET` | `/api/complaints/:id` | Role-Scoped | Retrieve single complaint |
| `PUT` | `/api/complaints/:id` | Customer / Admin | Update complaint (locked once assigned) |
| `PATCH` | `/api/complaints/:id/status` | Employee / Admin | Update status |
| `PATCH` | `/api/complaints/:id/assign` | Admin Only | Assign engineer to complaint |

### 👥 Staff & Customer Management (`/api/employees`, `/api/customers`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Admin Only | List all staff members |
| `POST` | `/api/employees` | Admin Only | Provision new employee account |
| `PUT` | `/api/employees/:id` | Admin Only | Update employee department & designation |
| `PATCH` | `/api/employees/:id/status` | Admin Only | Activate / Deactivate employee |
| `GET` | `/api/customers` | Admin Only | List registered customers |
| `GET` | `/api/customers/:id` | Authenticated | Retrieve customer profile |
| `PUT` | `/api/customers/:id` | Customer / Admin | Update address and profile info |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas Connection URI)

### 2. Backend Installation & Startup
```bash
# 1. Navigate to the server directory
cd server

# 2. Install dependencies
npm install

# 3. Create .env file (or verify existing .env)
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartserve?retryWrites=true&w=majority
# JWT_SECRET=your_super_secret_jwt_key
# PORT=5000

# 4. Build TypeScript and start the server
npm run build
npm run dev     # Starts server on http://localhost:5000
```

### 3. Frontend Installation & Startup
```bash
# 1. From the project root
cd ..

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev     # Launches UI on http://localhost:5173
```

---

## 🔑 Demo User Credentials

For demonstration and testing purposes, the following seed accounts are pre-configured in the database:

| Role | Email | Password | Primary Workspace |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartserve.io` | `SecurePassword123!` | `/admin` (Control Center & Triage) |
| **Support Engineer** | `sarah.support@smartserve.io` | `AgentSecurePassword123!` | `/employee` (Specialist Workspace) |
| **Customer** | `john.customer@example.com` | `CustomerPass123!` | `/customer` (Service Portal) |

*(New customers can also self-register at `/signup`.)*

---

## 🧪 Verification & Testing

```bash
# Build & Typecheck Frontend
npm run build

# Build Backend TypeScript
cd server
npm run build
```

---

## 📄 License
This project is licensed under the **MIT License**.
