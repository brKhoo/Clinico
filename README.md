# Clinico Scheduler

A modern, full-stack appointment scheduling web application built with Next.js, TypeScript, and Prisma.

## Features

- **Multiple Roles and Access Levels (RBAC)** - Two user roles: Patient and Provider with separate dashboards
- **User Authentication** - Secure login and signup with NextAuth.js
- **Appointment Management** - Create, view, reschedule, and cancel appointments
- **Scheduling Logic** - Schedule conflict detection and availability management
- **Modern UI** - Responsive user experience with Tailwind CSS

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Database**: SQLite (with Prisma)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components

## Get Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL="file:./prisma/dev.db"`
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET` (generate a random secret with `openssl rand -base64 32`)

3. **Set up the database:**
```bash
npm run db:push
npm run db:seed
```

4. **Run the dev server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000).**

## Demo Accounts

You can use this login info to test:

**Provider:**
- Email: `doc@clinico.com`
- Password: `doc123`
- Name: John Doe

**Patient:**
- Email: `patient@clinico.com`
- Password: `patient123`
- Name: Brook Khoo

## User Roles & Workflows

### Patient
- Sign up / sign in
- Browse appointment types -> pick provider (or first available)
- View available slots -> book
- View calendar and upcoming/past appointments
- Reschedule/cancel

### Doctor/Provider
- Sign in -> see calendar view and appointment list
- Set weekly availability
- View upcoming/past appointments and patient count
- Mark appointment completed/no-show -> add notes


## Database Schema

- **User**: User accounts with authentication and roles (PATIENT, PROVIDER)
- **Appointment**: Scheduled appointments with time slots, status, and notes
- **AppointmentType**: Configurable appointment types with duration and pricing
- **Availability**: Weekly availability settings per provider

## Available Scripts

- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with demo data
- `npm run db:reset` - Reset database and reseed
