# SafePing - Lone Worker Safety Monitoring

SafePing is a comprehensive lone worker safety monitoring application built with React, TypeScript, and Supabase. It provides real-time check-in monitoring, incident management, and safety compliance tools for organizations with remote or isolated workers.

## Project Structure

This is a monorepo managed with Turborepo and pnpm workspaces:

```
safeping/
├── apps/
│   ├── web/          # Admin dashboard (React + Vite)
│   ├── pwa/          # Worker mobile app (React PWA + Vite)
│   └── landing/      # Marketing website (React + Vite)
├── packages/
│   ├── ui/           # Shared UI components (Shadcn + Tailwind)
│   ├── database/     # Supabase types & client
│   ├── utils/        # Shared utilities
│   └── config/       # Shared configuration
├── supabase/
│   ├── migrations/   # Database migrations
│   ├── functions/    # Edge functions
│   └── seed.sql      # Seed data
└── docs/            # Documentation
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **PWA**: Workbox, IndexedDB (Dexie)
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd safeping
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
# Copy example env files
cp apps/web/.env.example apps/web/.env.local
cp apps/pwa/.env.example apps/pwa/.env.local
cp apps/landing/.env.example apps/landing/.env.local

# Configure your Supabase credentials in each .env.local file
```

4. Start Supabase locally (optional):

```bash
npx supabase start
```

5. Run the development servers:

```bash
# Run all apps
pnpm dev

# Or run specific apps
pnpm --filter web dev
pnpm --filter pwa dev
pnpm --filter landing dev
```

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages
- `pnpm test` - Run tests

## Apps

### Web App (Admin Dashboard)

- **URL**: http://localhost:5173
- **Purpose**: Administrative interface for safety managers
- **Features**:
  - Worker management
  - Real-time check-in monitoring
  - Incident tracking
  - Schedule management
  - Reporting and analytics

### PWA (Worker App)

- **URL**: http://localhost:5174
- **Purpose**: Mobile-first app for field workers
- **Features**:
  - One-tap check-ins
  - Offline functionality
  - GPS location tracking
  - Emergency alerts
  - Two-way messaging

### Landing Site

- **URL**: http://localhost:5175
- **Purpose**: Marketing and public-facing website
- **Features**:
  - Product information
  - Pricing plans
  - Industry solutions
  - Documentation

## Key Features

### 🛡️ Safety Monitoring

- Real-time worker status tracking
- Automated check-in schedules
- GPS location verification
- Emergency alert system

### 📱 Mobile-First Design

- Progressive Web App (PWA)
- Offline capability
- Push notifications
- Touch-optimized interface

### 🔧 Admin Dashboard

- Comprehensive worker management
- Incident tracking and reporting
- Escalation chain configuration
- Compliance reporting

### 🏢 Multi-Tenant

- Organization-based isolation
- Role-based access control
- Customizable settings
- Scalable architecture

## Database Schema

The application uses PostgreSQL with Row Level Security (RLS) for multi-tenancy:

- **organizations** - Tenant isolation
- **users** - Worker and admin accounts
- **check_ins** - Safety check-in records
- **schedules** - Check-in schedule definitions
- **incidents** - Safety incident tracking
- **messages** - Two-way communication
- **audit_logs** - System activity tracking

## Development

### Adding New Features

1. Create feature branch from main
2. Implement changes in appropriate package/app
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configuration
- Write meaningful commit messages
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for utilities and business logic
- Add integration tests for API endpoints
- Test PWA functionality across devices
- Verify offline capabilities

## Deployment

### Supabase Setup

1. Create new Supabase project
2. Run migrations: `npx supabase db push`
3. Configure RLS policies
4. Set up edge functions
5. Configure authentication providers

### Environment Configuration

Production environment variables:

```env
# Supabase
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Services
VITE_CLICKSEND_API_KEY=your_clicksend_key
VITE_RESEND_API_KEY=your_resend_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_key

# URLs
VITE_WEB_URL=https://admin.safeping.app
VITE_PWA_URL=https://app.safeping.app
VITE_LANDING_URL=https://safeping.app
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Contact: support@safeping.app
- Documentation: https://docs.safeping.app# Test comment
