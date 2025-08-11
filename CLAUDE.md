# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build all apps:**
```bash
pnpm build
```

**Start development servers:**
```bash
# All apps
pnpm dev

# Specific apps
pnpm --filter web dev      # Admin dashboard (port 5173)
pnpm --filter pwa dev      # Worker PWA (port 5174)  
pnpm --filter landing dev  # Landing site (port 5175)
```

**Linting and type checking:**
```bash
pnpm lint        # ESLint across all packages
pnpm typecheck   # TypeScript checking
```

**Testing:**
```bash
pnpm test        # Run all tests
```

**Supabase development:**
```bash
# Local development
npx supabase start    # Start local Supabase stack
npx supabase db push  # Push migrations to database

# Production setup (see SETUP.md for full guide)
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase db push
npx supabase functions deploy
npx supabase secrets set SMS_PROVIDER=clicksend
```

**Important:** Check SETUP.md for complete environment setup including SMS providers and secrets configuration.

## Product Overview

SafePing is a lone worker safety monitoring platform providing automated check-ins, real-time monitoring, and emergency response for remote workers. The system ensures compliance with safety regulations while reducing workplace incidents.

### Key Business Objectives
- Reduce workplace incidents by 80% through proactive monitoring
- Achieve 99.9% system uptime for critical safety operations
- Maintain <2 minute emergency response times
- Support organizations with 10-500 employees across construction, utilities, healthcare, and security

### Target Applications
- **Construction**: Site-specific check-ins with weather hazard alerts
- **Healthcare**: Home health visitor tracking with HIPAA compliance
- **Utilities**: Remote location monitoring with man down detection
- **Security**: Patrol check-points with silent alarms

## Architecture Overview

### Monorepo Structure
- **Turborepo** with **pnpm workspaces** for dependency management
- **apps/web**: React admin dashboard for safety managers
- **apps/pwa**: React PWA for field workers (mobile-first)
- **apps/landing**: Marketing website (domain: safeping.novaly.app)
- **packages/**: Shared UI components, utilities, and configuration
- **supabase/**: Database schema, migrations, and edge functions

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State**: Zustand stores with devtools
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **PWA**: Workbox for offline functionality

### Database Architecture
Multi-tenant PostgreSQL with Row Level Security (RLS):
- **organizations**: Tenant isolation root table
- **users**: Worker and admin accounts with role-based access
- **check_ins**: Safety check-in records with location/status
- **schedules**: Automated check-in schedule definitions
- **incidents**: Safety incident tracking and escalation
- **messages**: Two-way communication system

### Core Feature Implementation

**Check-in System:**
- 3-level automated escalation (5min, 15min, 30min overdue)
- Offline-capable PWA with IndexedDB storage
- SMS/push notification fallbacks
- Location tracking (optional) with GPS accuracy

**Multi-level Escalation Chain:**
- Level 1: Push notification + SMS to worker (orange status)
- Level 2: Alert assigned admin + SMS (red status)  
- Level 3: Alert all admins + call worker + SMS emergency contacts

**Pricing Tiers:**
- Starter: $4.90/worker/month (up to 10 workers)
- Professional: $3.90/worker/month (11-50 workers) 
- Enterprise: Custom pricing (50+ workers)

### Key Application Patterns

**Authentication Flow:**
- Supabase Auth integration in `apps/web/src/lib/auth.ts`
- SMS verification for workers, email for admins
- Role-based access: super_admin, admin, supervisor, worker
- Protected routes with organization-scoped access

**Database Types:**
- TypeScript database types defined in `apps/web/src/lib/supabase.ts` 
- Generated from Supabase schema for type safety
- Row Level Security for multi-tenant isolation

**Component Architecture:**
- Shared layouts in `apps/web/src/components/layouts/`
- Page components in `apps/web/src/pages/`
- PWA-specific components for offline functionality
- Reusable UI components following Shadcn patterns

**Safety Monitoring:**
- Check-in statuses: safe, overdue, missed, emergency
- Real-time dashboard updates via Supabase Realtime
- Incident management with timeline tracking
- Compliance reporting for OSHA and insurance requirements

### Environment Setup
Each app requires `.env.local` files with Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### External Service Integrations
- **SMS**: ClickSend (primary), Twilio (fallback)
- **Email**: Resend for transactional emails
- **Payments**: Stripe for subscription billing
- **Monitoring**: Sentry for error tracking
- **Analytics**: Plausible for privacy-focused analytics

### Development Workflow
1. Use `pnpm dev` to start all development servers
2. Supabase runs locally on port 54321 (API) and 54323 (Studio)
3. Web dashboard accessible at http://localhost:5173
4. Worker PWA accessible at http://localhost:5174
5. Landing site accessible at http://localhost:5175
6. Always run `pnpm lint` and `pnpm typecheck` before committing

### Key Success Metrics
- System uptime: 99.9% target
- API response time: <200ms (95th percentile)
- Check-in processing: <2 seconds end-to-end
- SMS delivery rate: >98%
- Emergency response time: <2 minutes