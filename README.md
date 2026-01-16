# Clinico Scheduler

A modern, full-featured appointment scheduling application built with Next.js, TypeScript, and Prisma.

## Features

- **Role-Based Access Control (RBAC)** - Two user roles: Patient and Provider with separate dashboards
- **User Authentication** - Secure signup and login with NextAuth.js
- **Appointment Management** - Create, view, reschedule, and cancel appointments
- **Scheduling Logic** - Conflict detection and availability management
- **Modern UI** - Responsive interface with Tailwind CSS
- **Audit Logging** - Track all system changes and user actions
- **Soft Delete** - Archive users and appointment types without losing data
- **Waitlist System** - Join waitlists when appointments are unavailable
- **Clinic Policies** - Configurable cancellation and reschedule cutoffs

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (with Prisma)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

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
- `DATABASE_URL="file:./prisma/dev.db"` (SQLite database)
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET` (generate a random secret, e.g., using `openssl rand -base64 32`)

3. **Set up the database:**
```bash
npm run db:push
npm run db:seed
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Demo Credentials

After running the seed script, you can use these credentials:

**Provider 1:**
- Email: `doctor.smith@clinico.com`
- Password: `provider123`

**Provider 2:**
- Email: `doctor.jones@clinico.com`
- Password: `provider123`

**Patient:**
- Email: `patient@clinico.com`
- Password: `patient123`

## User Roles & Workflows

### Patient
- Sign up / sign in → complete profile
- Browse appointment types → pick provider (or "first available")
- View available slots → book → receive confirmation
- Upload intake forms / add notes (until cutoff)
- Reschedule/cancel (policy enforced) → view upcoming + past appointments

### Doctor/Provider
- Sign in → see day/week calendar + upcoming list
- Set weekly availability + add exceptions (vacation/holiday blocks)
- Review patient intake status + notes before visit
- Mark appointment completed / no-show → add clinical notes
- Optionally propose follow-up slots / appointment types


## Database Schema

- **User**: User accounts with authentication and roles (PATIENT, PROVIDER)
- **Appointment**: Scheduled appointments with time slots, status, and notes
- **AppointmentType**: Configurable appointment types with duration and pricing
- **Availability**: Weekly availability settings per provider
- **AvailabilityException**: One-time availability blocks (vacations, holidays)
- **WaitlistEntry**: Patient waitlist entries for unavailable slots
- **AuditLog**: System activity and change tracking
- **ClinicPolicy**: Clinic-wide policies (cancellation cutoffs, office hours)
- **WebhookEvent**: Webhook events for integrations

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with demo data
- `npm run db:reset` - Reset database and reseed

## Project Structure

```
/app
  /api          - API routes
  /patient      - Patient dashboard and pages
  /provider     - Provider dashboard and pages
/components    - React components
/lib           - Utilities (auth, prisma, rbac, audit)
/prisma        - Database schema and migrations
/types         - TypeScript type definitions
```

## Implementation Status

### ✅ Completed
- [x] Prisma schema with all models (User, Appointment, AppointmentType, AuditLog, WaitlistEntry, etc.)
- [x] Role-based access control (RBAC) with middleware
- [x] Role-based dashboards (/patient, /provider)
- [x] Database seed script with demo accounts
- [x] Audit logging infrastructure
- [x] Soft delete support (isArchived fields)

### 🚧 In Progress / To Do
- [ ] Calendar UI views (day/week for providers)
- [ ] Reschedule and cancellation flow with policy enforcement
- [ ] Waitlist UI and notification system
- [ ] Search and filters for appointments
- [ ] Webhook system implementation
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Patient profile completion flow
- [ ] Appointment booking flow with provider selection
- [ ] Provider availability management UI

## Development

### Adding New Features

1. Update the Prisma schema if database changes are needed
2. Run `npm run db:push` to apply schema changes
3. Update TypeScript types if needed
4. Create API routes in `/app/api`
5. Create UI components in `/components`
6. Add audit logging for critical actions using `logAuditEvent` from `/lib/audit`

### Database Migrations

For production, use Prisma migrations:
```bash
npm run db:migrate
```

For development, you can use `db:push` which is faster but doesn't create migration files.

## License

MIT
