# Scholync — University Management System

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

---

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

---

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

## Running Locally

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
