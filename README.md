# 🚀 SmartServe — Cloud Service Desk & Incident Management Platform

**SmartServe** is an enterprise-grade, full-stack customer support and incident management suite built with **React 19**, **TypeScript**, **Tailwind CSS**, **Node.js / Express**, and **MongoDB Atlas**. It provides role-based workspaces for **Administrators**, **Support Specialists (Employees)**, and **Customers** with automated status tracking, triage feeds, real-time SLA breach countdowns, QR-code tracking, multi-file evidence upload, and customer satisfaction (CSAT) ratings.

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Access Control (RBAC)
- **Admin**: Full visibility over system health, staff provisioning, customer directories, global ticket/complaint queues, engineer assignments, SLA breach monitors, and aggregate CSAT performance.
- **Support Specialist (Employee)**: Scoped work queue displaying assigned tickets and complaints, urgent SLA attention feeds, canned response templates, one-click status transitions, and evidence verification.
- **Customer**: Dedicated portal to submit service tickets, file formal complaints, track resolution progress, upload evidence, scan QR codes, rate resolved tickets (CSAT), and edit open requests prior to assignment.

### 2. 📋 Service Tickets & Complaint Suites
- **Symmetric Lifecycle Architecture**: Full CRUD support with priority weights (`Critical`, `High`, `Medium`, `Low`) and statuses (`Open`, `In Progress`, `Resolved`, `Closed`).
- **Server-Side Security**:
  - Role-scoped endpoint queries (Customers see only own items; Employees see only assigned items; Admins see all).
  - Customer edit-lock prevents modifications once an item is assigned or processed (`400 Bad Request`).
  - Automated status advancement (`Open` &rarr; `In Progress`) upon engineer assignment.

---

## 🚀 Advanced Next-Gen Capabilities

### 3. 📎 Document & Evidence Upload Suite
- **Multi-Role Evidence Sharing**: Upload photos, diagnostic screenshots, PDFs, logs, or invoices directly to any ticket or complaint.
- **Cross-Role Collaboration**: Customers upload problem proof; Support Specialists inspect attachments to reproduce bugs; Admins inspect files for audit and SLA accountability.
- **Interactive File Viewer**: Direct download, file-type icons, size formatting, and deletion permissions.

### 4. ⏱️ Dynamic SLA Breach Timer
- **Priority-Weighted SLA Timers**:
  - **Critical**: 4 hours resolution window.
  - **High**: 12 hours resolution window.
  - **Medium**: 48 hours resolution window.
  - **Low**: 168 hours (7 days) resolution window.
- **Real-Time Countdown Badges**: Color-coded badges indicating remaining time or highlighting overdue items (`SLA Breached`).
- **Executive Health Metrics**: Real-time SLA compliance percentage and breach counters displayed on the Admin and Employee command centers.

### 5. ⭐ CSAT (Customer Satisfaction) Rating System
- **Post-Resolution Surveys**: Once a ticket or complaint transitions to `Resolved` or `Closed`, customers are prompted with an interactive 1–5 star rating modal with optional qualitative feedback.
- **Executive CSAT Scorecard**: Admin dashboard displays real-time average CSAT score out of 5.0, total verified review counts, and rating distribution breakdowns.

### 6. 📱 QR Code Tracking & Public Live Status Page
- **Auto-Generated QR Codes**: Every service ticket and complaint generates a permanent, high-resolution QR code upon creation.
- **Public Tracking Portal (`/track/:type/:id`)**: External or mobile users can scan the QR code to check live incident progress, current status, assigned engineer, category, SLA countdown, and resolution notes without logging in.
- **One-Click Actions**: Support staff and customers can download the QR code image or copy the direct tracking URL.

### 7. 🤖 Smart Auto-Reply & Nodemailer Email Notifications
- **Automated Email Dispatch**: Sends instant email notifications to customers with embedded QR codes upon ticket creation, assignment, status change, and resolution.
- **Canned Responses Engine**: Support specialists have access to pre-built, standardized response templates for common inquiries (e.g., initial acknowledgment, requesting more info, resolution notification, escalation warning) with one-click copy-to-clipboard.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide React, Axios, date-fns, Vite |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Multer, QRCode, Nodemailer, JWT, bcryptjs, CORS |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Dev Tools** | TypeScript Compiler (`tsc`), PostCSS, Autoprefixer |

---

## 📁 Project Structure

```text
SmartServe/
├── src/                               # Frontend React Application
│   ├── components/
│   │   ├── auth/                      # ProtectedRoute & Role Guards
│   │   ├── ui/                        # Reusable Component Library
│   │   │   ├── AttachmentSection.tsx  # Document Upload & File List Component
│   │   │   ├── Badge.tsx              # Priority & Status Tag Component
│   │   │   ├── Button.tsx             # Interactive Button with Loading States
│   │   │   ├── CannedResponsesModal.tsx # Quick Response Templates Modal
│   │   │   ├── Card.tsx               # Metric & Container Cards
│   │   │   ├── Input.tsx              # Validated Form Inputs
│   │   │   ├── Modal.tsx              # Accessible Popover Dialogs
│   │   │   ├── QRCodeModal.tsx        # QR Code Display, Download & Link Sharing
│   │   │   ├── RatingModal.tsx        # 1-5 Star CSAT Feedback Dialog
│   │   │   ├── Select.tsx             # Dropdown Selectors
│   │   │   ├── SidebarLayout.tsx      # Unified Navigation Layout & Topbar
│   │   │   ├── SlaBadge.tsx           # Dynamic SLA Countdown & Breach Badge
│   │   │   ├── Table.tsx              # Data Table Container & Rows
│   │   │   └── Textarea.tsx           # Multi-line Text Inputs
│   │   └── ErrorBoundary.tsx          # Global Runtime Exception Boundary
│   ├── context/
│   │   └── AuthContext.tsx            # JWT State, User Profile & Session Persistence
│   ├── lib/
│   │   └── dateUtils.ts               # Relative Distance & Priority Weights
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── CustomerManagement.tsx # Customer Directory & Profiles
│   │   │   └── EmployeeManagement.tsx # Staff Provisioning & Activation
│   │   ├── AdminDashboard.tsx         # Executive Admin Center, Triage & CSAT
│   │   ├── CustomerDashboard.tsx      # Customer Portal, Submissions & Ratings
│   │   ├── EmployeeDashboard.tsx      # Specialist Workspace & Urgent SLA Feed
│   │   ├── LoginPage.tsx              # Authentication Login Screen
│   │   ├── SignupPage.tsx             # Customer Registration Screen
│   │   ├── TrackingPage.tsx           # Public QR Status Tracking Page
│   │   └── NotFoundPage.tsx           # 404 Route Handler
│   ├── services/
│   │   ├── api.ts                     # Axios Instance with JWT Interceptors
│   │   ├── attachmentService.ts       # Document Upload/Download/Delete Client
│   │   ├── authService.ts             # Signup, Login, Me Endpoints
│   │   ├── complaintService.ts        # Complaint CRUD API Client
│   │   ├── customerService.ts         # Customer Directory API Client
│   │   ├── employeeService.ts         # Employee Management API Client
│   │   ├── ratingService.ts           # CSAT Rating API Client
│   │   ├── ticketService.ts           # Ticket CRUD API Client
│   │   └── trackingService.ts         # Public QR Tracking API Client
│   ├── App.tsx                        # Router Configuration & Role Routes
│   └── main.tsx                       # React Entry Point
│
├── server/                            # Backend Node.js + TypeScript Service
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                  # Mongoose MongoDB Connection
│   │   ├── controllers/
│   │   │   ├── attachment.controller.ts # File Upload & Deletion Handlers
│   │   │   ├── auth.controller.ts     # Signup, Login, Profile Handlers
│   │   │   ├── complaint.controller.ts# Role-Scoped Complaint Lifecycle
│   │   │   ├── customer.controller.ts # Customer Directory Handlers
│   │   │   ├── employee.controller.ts # Employee Management Handlers
│   │   │   ├── rating.controller.ts   # CSAT Rating & Analytics Handlers
│   │   │   ├── ticket.controller.ts   # Role-Scoped Ticket Lifecycle
│   │   │   └── tracking.controller.ts # Public Unauthenticated Tracking Handlers
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts      # JWT Authentication Guard
│   │   │   ├── roleMiddleware.ts      # Role-Based Permission Guard
│   │   │   └── upload.ts              # Multer File Storage Configuration
│   │   ├── models/
│   │   │   ├── Attachment.ts          # Document & Evidence Schema
│   │   │   ├── Complaint.ts           # Complaint Schema with SLA & QR
│   │   │   ├── Customer.ts            # Customer Profile Schema
│   │   │   ├── Employee.ts            # Staff Profile Schema
│   │   │   ├── Rating.ts              # CSAT 1-5 Star Rating Schema
│   │   │   ├── Ticket.ts              # Ticket Schema with SLA & QR
│   │   │   └── User.ts                # Base User Account Schema
│   │   ├── routes/
│   │   │   ├── attachment.routes.ts   # /api/attachments
│   │   │   ├── auth.routes.ts         # /api/auth
│   │   │   ├── complaint.routes.ts    # /api/complaints
│   │   │   ├── customer.routes.ts     # /api/customers
│   │   │   ├── employee.routes.ts     # /api/employees
│   │   │   ├── rating.routes.ts       # /api/ratings
│   │   │   ├── ticket.routes.ts       # /api/tickets
│   │   │   └── tracking.routes.ts     # /api/track
│   │   ├── utils/
│   │   │   ├── cannedResponses.ts     # Standardized Support Templates
│   │   │   ├── emailService.ts        # Nodemailer Notification Transporter
│   │   │   ├── qrGenerator.ts         # QR Code Generation Utility
│   │   │   └── sla.ts                 # Dynamic SLA Calculation Engine
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
| `POST` | `/api/tickets` | Authenticated | Create a service ticket (calculates SLA deadline & QR code) |
| `GET` | `/api/tickets` | Role-Scoped | Admin: All, Employee: Assigned, Customer: Own |
| `GET` | `/api/tickets/:id` | Role-Scoped | Retrieve single ticket details |
| `PUT` | `/api/tickets/:id` | Customer / Admin | Update ticket (locked for customers once assigned) |
| `PATCH` | `/api/tickets/:id/status` | Employee / Admin | Update status & trigger email notification |
| `PATCH` | `/api/tickets/:id/assign` | Admin Only | Assign engineer (sets status to `In Progress` & notifies) |

### ⚠️ Complaints (`/api/complaints`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | Authenticated | Submit formal complaint (calculates SLA & QR code) |
| `GET` | `/api/complaints` | Role-Scoped | Admin: All, Employee: Assigned, Customer: Own |
| `GET` | `/api/complaints/:id` | Role-Scoped | Retrieve single complaint |
| `PUT` | `/api/complaints/:id` | Customer / Admin | Update complaint (locked once assigned) |
| `PATCH` | `/api/complaints/:id/status` | Employee / Admin | Update status & trigger email notification |
| `PATCH` | `/api/complaints/:id/assign` | Admin Only | Assign engineer to complaint |

### 📎 Evidence & Documents (`/api/attachments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attachments/upload` | Authenticated | Upload multi-file evidence to a ticket or complaint |
| `GET` | `/api/attachments/:entityType/:entityId` | Authenticated | Retrieve all attached documents |
| `DELETE` | `/api/attachments/:id` | Authenticated | Delete an uploaded document |

### ⭐ CSAT Satisfaction Ratings (`/api/ratings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ratings` | Customer | Submit 1–5 star rating and feedback for resolved item |
| `GET` | `/api/ratings/item/:entityType/:entityId` | Authenticated | Fetch CSAT rating for a specific item |
| `GET` | `/api/ratings/stats` | Admin | Retrieve aggregate CSAT metrics and average score |

### 📱 Public QR Tracking (`/api/track`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/track/:entityType/:id` | Public | Fetch public status and SLA info for QR scanner |

### 💬 Canned Responses (`/api/canned-responses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/canned-responses` | Authenticated | Retrieve support response templates |

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

# 3. Create .env file
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartserve?retryWrites=true&w=majority
# JWT_SECRET=your_super_secret_jwt_key
# PORT=5000
# CLIENT_URL=http://localhost:5173

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

| Role | Email | Password | Primary Workspace |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartserve.io` | `SecurePassword123!` | `/admin` (Control Center, Triage & CSAT) |
| **Support Engineer** | `sarah.support@smartserve.io` | `AgentSecurePassword123!` | `/employee` (Specialist Workspace & Canned Responses) |
| **Customer** | `john.customer@example.com` | `CustomerPass123!` | `/customer` (Service Portal, Evidence & CSAT) |

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
