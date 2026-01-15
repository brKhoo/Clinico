# Clinico Scheduler

A modern, full-featured appointment scheduling application built with Next.js, TypeScript, and Prisma.

## Features

- **User Authentication** - Secure signup and login with NextAuth.js
- **Clinico Management** - Create, view, and cancel appointments
- **Scheduling Logic** - Conflict detection and availability management
- **Modern UI** - Responsive interface with Tailwind CSS
- **Dashboard** - Overview of appointments and statistics
- **Availability Settings** - Configure your weekly availability

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Database**: SQLite (with Prisma)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL="file:./dev.db"` (SQLite database)
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET` (generate a random secret, e.g., using `openssl rand -base64 32`)

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Register an Account**: Click "Sign Up" and create a new account
2. **Login**: Use your credentials to sign in
3. **Create Appointments**: Click "New Clinico" to schedule meetings
4. **Set Availability**: Go to "Availability" to configure your weekly schedule
5. **Manage Appointments**: View and cancel appointments from the dashboard


## Database Schema

- **User**: User accounts with authentication
- **Clinico**: Scheduled appointments with time slots
- **Availability**: Weekly availability settings per user

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
