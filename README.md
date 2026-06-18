<!-- # Scholync — University Management System

A full-stack university management platform built with **Angular 19** and **Node.js / Express 5 / MongoDB**.

## Features

- **Multi-tenant** — each university gets its own URL slug (`/mit/dashboard`, `/harvard/dashboard`)
- **Role-based access** — Admin, Professor, Student (+ hidden Superadmin CMS)
- **Authentication** — Email OTP verification on signup, JWT sessions with token blacklist on logout
- **Courses** — Create, enroll, manage capacity, stream (announcements + materials), gradebook
- **Assignments** — Create with file attachments, student submissions, professor grading
- **Attendance** — Per-session tracking with present / late / absent, student view with percentage
- **File uploads** — Cloudinary (assignment files + profile pictures with face-aware crop)
- **Password reset** — OTP-based forgot-password flow
- **Security** — Helmet headers, rate limiting, NoSQL injection sanitisation, ReDoS protection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, Angular Material, NgModules |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Storage | Cloudinary |
| Email | Nodemailer + Gmail SMTP via Vercel serverless function |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

--- -->

<div align="center">

# 🎓 Scholync

### A full-stack, multi-tenant University Management Platform

<br/>

[![Angular](https://img.shields.io/badge/Angular_19-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

<br/>

> **Scholync** is a production-ready university management system — built to run a real institution. It handles everything from student onboarding and OTP verification, to live course streams, assignment submission, attendance tracking, a full gradebook, and a superadmin control panel — all wrapped in a beautiful dark-glass UI with light mode support.

<br/>

Features · Tech Stack · Architecture · Project Structure· Getting Started 

</div>

---

## ✨ Features

### 👤 Authentication & Onboarding
- Email + OTP two-step signup (email sent via Vercel serverless function)
- JWT-based auth with token blacklisting on logout (TTL-indexed MongoDB collection)
- Forgot password with OTP reset flow (3 step: request → verify → reset)
- Route guards for authenticated and unauthenticated users

### 🏫 Multi-Tenant University System
- Each university has a unique **slug** — all data is scoped to it
- Admins register their institution on first signup
- Students and professors join by university ID
- Pending approval workflow — admins approve/reject members

### 🖥️ Role-Based Dashboards
| Role | Capabilities |
|------|-------------|
| **Admin** | Manage users, create/delete courses, assign professors, view stats |
| **Professor** | Run courses, post announcements & materials, create assignments, grade submissions, take attendance |
| **Student** | Enroll in courses, submit assignments, view grades & feedback, track attendance |

### 📚 Google Classroom-Inspired Course View
Four-tab layout per course:
- **Stream** — Announcements & material feed with compose, file attachments, edit/delete
- **Classwork** — Assignments grouped by topic, due-date badges (overdue / due soon)
- **People** — Professors and enrolled students
- **Grades** — Sticky-column gradebook spreadsheet with per-assignment scores

### 📎 File Uploads (Cloudinary)
- Assignment files (PDF, DOCX, etc.) uploaded directly to Cloudinary
- Profile photos with face-aware smart crop (`gravity: face`)
- Secure signed URLs, no direct client-to-server file transfers

### 📊 Attendance Module
- Professors mark present / late / absent per student per session
- Students see their attendance ring (% with color: green / amber / red)
- Full session history with expandable per-session records
- Professor-side stats table with per-student attendance percentages

### 🔐 Superadmin CMS
- Separate login with its own JWT secret — completely isolated from main auth
- Create universities with slug, domain, and address
- Manage all users across all universities (search, filter by role/status, approve/reject/delete)
- Platform-wide stats: total universities, users, courses

### 🎨 Dark / Light Mode UI
- Glass-morphism dark theme (`#0a0a0f` base, Electric Blue + Amber accent)
- Full light mode toggle (`#eef2ff` base) — persisted on the user's device
- Collapsible sidebar, responsive breakpoints down to 480px
- Skeleton shimmer loading states throughout

---

## 🛠 Tech Stack

### Frontend
| Layer | Choice |
|-------|--------|
| Framework | Angular 19 (NgModules, `standalone: false`) |
| UI Library | Angular Material MDC |
| Styling | Custom CSS — glass morphism + CSS variables |
| Typography | Poppins (Google Fonts) |
| Forms | Angular Reactive Forms |
| HTTP | Angular HttpClient + JWT interceptor |
| Routing | Lazy-loaded feature modules with auth guards |
| OTP delivery | Vercel Serverless Function (bypasses Render SMTP block) |

### Backend
| Layer | Choice |
|-------|--------|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB Atlas (Mongoose 8) |
| Auth | jsonwebtoken + bcryptjs + TokenBlacklist model |
| Security | Helmet, express-rate-limit, mongo-sanitize, custom escapeRegex() |
| File Storage | Cloudinary (multer → cloudinary stream) |
| Email | Nodemailer via Gmail SMTP (on Vercel) |
| Deployment | Render (free tier, auto-sleep) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTS                                │
│  Browser (Angular SPA)    Vercel Serverless (OTP emails)    │
└────────────────┬──────────────────────┬─────────────────────┘
                 │ HTTPS                │ SMTP (Gmail)
┌────────────────▼──────────────────────▼─────────────────────┐
│                    EXPRESS 5 API  (Render)                  │
│                                                             │
│  /api/auth          /api/admin        /api/courses          │
│  /api/assignments   /api/attendance   /api/university       │
│  /api/superadmin    /api/upload                             │
│                                                             │
│  Middleware stack:                                          │
│  helmet → rate-limit → cors → mongo-sanitize → requireRole()│
└────────────────┬───────────────────────┬────────────────────┘
                 │ Mongoose 8            │ Cloudinary SDK
┌────────────────▼────────┐   ┌──────────▼───────────────────┐
│   MongoDB Atlas         │   │   Cloudinary                 │
│   (multi-tenant)        │   │   (profile pics, files)      │
│                         │   │                              │
│   Users  Courses        │   │   face-crop avatars          │
│   Posts  Assignments    │   │   assignment attachments     │
│   Submissions Attendance│   │                              │
│   TokenBlacklist (TTL)  │   └──────────────────────────────┘
└─────────────────────────┘
```

## Project Structure

```
scholync-showcase/
├── backend/          Express API
│   ├── config/       Cloudinary + Mailer setup
│   ├── controllers/  Route handlers
│   ├── middleware/   JWT auth, RBAC, file upload
│   ├── models/       Mongoose schemas
│   ├── routes/       API route definitions
│   └── utils/        Security helpers
└── frontend/         Angular 19 SPA
    ├── api/          Vercel serverless function (OTP email)
    └── src/app/
        ├── guards/         Route guards
        ├── interceptors/   HTTP auth interceptor
        ├── models/         TypeScript interfaces
        └── services/       API service layer
```

---
<!--
## API Overview

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Public | Register + send OTP |
| POST | `/api/auth/verify-otp` | Public | Verify email OTP |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/logout` | Auth | Blacklist JWT |
| POST | `/api/auth/forgot-password` | Public | Send reset OTP |
| POST | `/api/auth/reset-password` | Public | Reset with OTP |
| GET | `/api/universities` | Public | List all universities |
| GET | `/api/admin/users` | Admin | List users in university |
| PATCH | `/api/admin/users/:id/approve` | Admin | Approve/reject user |
| GET | `/api/courses` | Auth | List courses |
| POST | `/api/courses` | Admin/Professor | Create course |
| POST | `/api/courses/:id/enroll` | Student | Enroll in course |
| GET | `/api/courses/:id/gradebook` | Admin/Professor | Full gradebook |
| POST | `/api/assignments` | Admin/Professor | Create assignment |
| POST | `/api/assignments/:id/submit` | Student | Submit assignment |
| PATCH | `/api/assignments/:id/submissions/:sid/grade` | Admin/Professor | Grade submission |
| POST | `/api/attendance` | Admin/Professor | Mark attendance |
| GET | `/api/attendance/my` | Student | My attendance summary |

--- -->

## Environment Variables

Copy `backend/.env.example` and fill in your values:

```
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ALLOWED_ORIGINS=
NODE_ENV=production
```

The frontend reads `src/environments/environment.prod.ts` for the API URL.

---

## Getting Started

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm start              # nodemon server.js on :3000
```

**Frontend**
```bash
cd frontend
npm install
ng serve               # Angular dev server on :4200
```

---

## 📄 License

This project is for educational and portfolio purposes.

---

<div align="center">

Built with ❤️ by **Raman**

</div>
