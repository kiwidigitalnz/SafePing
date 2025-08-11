# SafePing Product Requirements Document (PRD)

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Public Website Structure](#public-website-structure)
4. [Authentication & Onboarding](#authentication--onboarding)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Core Features](#core-features)
7. [Technical Architecture](#technical-architecture)
8. [Database Schema](#database-schema)
9. [Security & Compliance](#security--compliance)
10. [Development Roadmap](#development-roadmap)
11. [Success Metrics](#success-metrics)

## Executive Summary

SafePing is a comprehensive lone worker safety solution that ensures regular check-ins from remote workers through a web-based admin dashboard and Progressive Web App (PWA) for field staff. The system provides automated escalation procedures, real-time monitoring, and compliance reporting to help organizations meet their duty of care obligations.

### Key Business Objectives
- Reduce workplace incidents by 80% through proactive monitoring
- Achieve 99.9% system uptime for critical safety operations
- Onboard 100 organizations within first 6 months
- Maintain <2 minute emergency response times

## Product Overview

### Vision Statement
To become the leading lone worker safety platform by providing simple, reliable, and accessible safety monitoring for every remote worker.

### Target Markets
- **Primary**: Construction, utilities, healthcare, security companies (10-500 employees)
- **Secondary**: Delivery services, field maintenance, real estate
- **Tertiary**: Any organization with remote or isolated workers

### Unique Value Proposition
- **Simple**: One-tap check-ins with intuitive interfaces
- **Reliable**: Offline-capable PWA with SMS fallbacks
- **Affordable**: Transparent per-worker pricing with no hidden fees
- **Compliant**: Built-in compliance reporting for safety regulations

## Public Website Structure

### Domain: safeping.novaly.app

### 1. Homepage (/)
```
Hero Section:
- Headline: "Never Leave Your Lone Workers Truly Alone"
- Subheadline: "Automated check-ins, instant alerts, and real-time monitoring for remote worker safety"
- CTA: "Start 7-Day Free Trial" → /signup
- Secondary CTA: "Watch Demo" → Modal video
- Hero Image: Worker using mobile app with admin dashboard preview

Trust Indicators:
- "Trusted by 500+ companies"
- Client logos (construction, utilities, healthcare)
- "99.9% Uptime" | "2-min Response Time" | "24/7 Monitoring"

Features Grid:
- Automated Check-ins (icon + description)
- Instant SOS Alerts (icon + description)
- Offline Capability (icon + description)
- Compliance Reports (icon + description)
- Real-time Monitoring (icon + description)
- Multi-level Escalation (icon + description)

How It Works:
1. Set up your team (screenshot)
2. Workers check in regularly (screenshot)
3. Automatic escalations if needed (screenshot)
4. Complete audit trail (screenshot)

Testimonials:
- 3 customer quotes with photos
- Industry and company size

Pricing Preview:
- "Starting at $4.90/worker/month"
- "No setup fees. No hidden costs."
- CTA: "View Pricing" → /pricing

Footer CTA:
- "Protect Your Team Today"
- Email capture for free safety guide
```

### 2. Features Page (/features)
```
Detailed Feature Sections:

For Workers:
- One-tap check-ins
- Offline mode
- SOS panic button
- Schedule visibility
- Two-way messaging
- Location sharing (optional)
- Man down detection
- Weather alerts

For Administrators:
- Real-time dashboard
- Custom check-in schedules
- Multi-level escalations
- Compliance reporting
- Incident management
- Team messaging
- Analytics & insights
- API access

For Organizations:
- Reduce liability
- Meet compliance requirements
- Lower insurance premiums
- Improve worker morale
- 24/7 peace of mind
- Audit trail documentation
```

### 3. Pricing Page (/pricing)
```
Pricing Tiers:

Starter - $4.90/worker/month
- Up to 10 workers
- Basic check-in schedules
- 2-level escalation
- Email support
- 100 SMS credits/month
- Basic reporting

Professional - $3.90/worker/month
- 11-50 workers  
- Advanced scheduling
- 3-level escalation
- Priority support
- 500 SMS credits/month
- Compliance reports
- API access

Enterprise - Custom pricing
- 50+ workers
- Custom features
- Unlimited escalation levels
- Dedicated support
- Unlimited SMS credits
- White-label options
- SLA guarantee

All Plans Include:
✓ 7-day free trial
✓ No setup fees
✓ Mobile app for workers
✓ Admin dashboard
✓ Offline capability
✓ Secure cloud storage
✓ Regular updates

FAQ Section:
- How does billing work?
- Can I change plans anytime?
- What happens after the trial?
- Do you offer discounts?
```

### 4. Industries Page (/industries)
```
Industry-Specific Solutions:

Construction:
- Site-specific check-ins
- Weather hazard alerts
- Equipment operator monitoring
- Compliance with safety regulations

Healthcare:
- Home health visitor tracking
- Discrete panic buttons
- HIPAA compliant
- Integration with scheduling systems

Utilities & Energy:
- Remote location monitoring
- Man down detection
- Hazardous area alerts
- Vehicle tracking integration

Security:
- Patrol check-points
- Silent alarms
- Incident reporting
- GPS tracking

[Each with specific case studies and testimonials]
```

### 5. Resources (/resources)
```
Content Types:

Safety Guides:
- "Complete Lone Worker Safety Guide"
- "Creating Effective Check-in Schedules"
- "Emergency Response Best Practices"

Compliance Resources:
- Industry regulation checklists
- Policy templates
- Training materials

Case Studies:
- How ABC Construction reduced incidents by 75%
- XYZ Healthcare's lone worker program

Webinars:
- Monthly safety best practices
- Product demonstrations
- Q&A sessions

Blog:
- Safety tips and news
- Product updates
- Industry insights
```

### 6. About Page (/about)
```
Sections:
- Our mission and story
- Leadership team
- Company values
- Safety statistics and impact
- Press mentions
- Awards and certifications
- Contact information
```

### 7. Support Page (/support)
```
Self-Service Resources:
- Getting started guide
- Video tutorials
- FAQ database
- System status page

Contact Options:
- Live chat (business hours)
- Email support
- Phone support (paid plans)
- Help ticket system

Documentation:
- Admin guide
- Worker app guide
- API documentation
- Integration guides
```

## Authentication & Onboarding

### Sign Up Flow (/signup)

#### Step 1: Account Creation
```jsx
// Form Fields:
- Company Name*
- Your Name*
- Work Email*
- Phone Number*
- Password*
- Number of Workers (dropdown)
- Industry (dropdown)
- [ ] I agree to Terms of Service

// Optional:
- How did you hear about us?
- Promo code

[Continue] → Email verification sent
```

#### Step 2: Email Verification
```
- Check email for verification link
- Click link → Return to app
- Alternative: Enter 6-digit code
```

#### Step 3: Company Setup
```jsx
// Organization Profile:
- Company Logo (upload)
- Time Zone*
- Primary Contact Number*
- Emergency Contact*

// Initial Configuration:
- Default check-in interval (30 min, 1hr, 2hr, 4hr)
- Working hours (e.g., 8 AM - 6 PM)
- Working days (Mon-Sun checkboxes)

[Continue]
```

#### Step 4: Invite First Worker (Optional)
```jsx
// Quick Start:
"Invite your first worker to test the system"
- Worker Name*
- Mobile Phone*
- [ ] Send invite via SMS now

[Skip for now] [Send Invite]
```

#### Step 5: Welcome Dashboard
```
// Onboarding Checklist:
□ Verify your email ✓
□ Complete company profile ✓
□ Invite your first worker (0/1)
□ Schedule your first check-in
□ Test the emergency escalation

// Quick Actions:
- Watch 2-min tutorial
- Invite team members
- Configure schedules
- Download worker app
```

### Sign In Flow (/login)

```jsx
// Standard Login:
- Email or Phone*
- Password*
- [ ] Remember me
- [Forgot Password?]

[Sign In]

// Alternative Options:
- Sign in with Google (admins only)
- Sign in with Microsoft (admins only)
- Magic link via email
- SMS code for workers
```

### Password Reset Flow
```
1. Enter email or phone
2. Receive reset link/code
3. Set new password
4. Auto-redirect to dashboard
```

### Worker Authentication Flow

#### SMS Invitation
```
"Hi [Name], you've been invited to SafePing by [Company].
Click here to set up your safety app: [link]
Reply STOP to opt out."
```

#### Worker Setup
```
1. Click SMS link → PWA landing page
2. Verify phone with SMS code
3. Set up profile:
   - Display name
   - Profile photo
   - Emergency contact
4. Install PWA with guided instructions
5. Grant permissions:
   - Notifications (required)
   - Location (optional)
   - Background sync (required)
6. Complete test check-in
```

## User Roles & Permissions

### Permission Matrix

| Feature | Super Admin | Org Admin | Admin | Staff |
|---------|------------|-----------|--------|-------|
| View all organizations | ✓ | ✗ | ✗ | ✗ |
| Manage billing | ✓ | ✓ | ✗ | ✗ |
| Invite/remove admins | ✓ | ✓ | ✗ | ✗ |
| Invite/remove staff | ✓ | ✓ | ✓ | ✗ |
| Configure schedules | ✓ | ✓ | ✓ | ✗ |
| View reports | ✓ | ✓ | ✓ | ✗ |
| Respond to alerts | ✓ | ✓ | ✓ | ✗ |
| Perform check-ins | ✗ | ✗ | ✗ | ✓ |
| Send SOS | ✗ | ✗ | ✗ | ✓ |
| Message admins | ✓ | ✓ | ✓ | ✓ |

## Core Features

### 1. Check-In System

#### Worker Check-In Flow
```
1. Push notification: "Check-in due"
2. Open PWA → Big buttons displayed:
   - "I'm OK" (Green)
   - "Send Help" (Red)
3. Optional: Add note or photo
4. Location captured (if permitted)
5. Confirmation message
6. Next check-in timer starts
```

#### Automated Escalation
```
Level 1 (5 min overdue):
- Push notification to worker
- SMS reminder
- Orange status in dashboard

Level 2 (15 min overdue):
- Alert to assigned admin
- SMS to admin
- Red status in dashboard

Level 3 (30 min overdue):
- Alert all admins
- Call worker's phone
- SMS emergency contacts
- Log incident
```

### 2. Admin Dashboard

#### Main Dashboard View
```
┌─────────────────────────────────────────┐
│ Active Workers: 24/28  [Refresh] [Filter]│
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ ✓ John  │ │ ! Sarah │ │ ✗ Mike  │    │
│ │ 10:30am │ │ 10:45am │ │ 9:15am  │    │
│ │ On Site │ │ Overdue │ │ Alert   │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ Recent Activity:                        │
│ • John checked in - 10:30 AM           │
│ • Sarah overdue - escalating - 10:45 AM│
│ • Mike SOS triggered - 9:15 AM         │
└─────────────────────────────────────────┘
```

#### Schedule Management
```javascript
// Example Schedule Configuration
{
  name: "Day Shift",
  checkInInterval: 60, // minutes
  startTime: "08:00",
  endTime: "18:00",
  activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  assignedWorkers: [userId1, userId2],
  escalationChain: [
    {
      level: 1,
      delayMinutes: 5,
      actions: ["push", "sms"],
      contacts: ["worker"]
    },
    {
      level: 2,
      delayMinutes: 15,
      actions: ["sms", "call"],
      contacts: ["supervisor", "admin"]
    }
  ]
}
```

### 3. Progressive Web App (PWA)

#### Key Features
```
Offline Capabilities:
- Cache check-in data locally
- Queue check-ins when offline
- Sync when connection restored
- Show offline indicator

Background Operations:
- Background sync for check-ins
- Push notifications
- Location updates
- Fall detection monitoring

UI Components:
- Large, touch-friendly buttons
- High contrast mode
- Simple navigation
- Clear status indicators
```

### 4. Communication System

#### Real-time Messaging
```
Features:
- Admin ↔ Worker chat
- Broadcast messages
- Read receipts
- File attachments
- Message history
- Offline message queue
```

### 5. Reporting & Analytics

#### Compliance Reports
```
Monthly Safety Report:
- Total check-ins: 4,320
- On-time rate: 96.2%
- Incidents: 3
- Average response time: 1.8 min
- Worker compliance scores
- Downloadable PDF/CSV
```

## Technical Architecture

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐
│   Web App       │     │    PWA App      │
│   (React)       │     │    (React)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │  CDN/Cache  │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────┴─────┐          ┌──────┴──────┐
    │ Supabase │          │   Services  │
    │ Backend  │          │   (APIs)    │
    └────┬─────┘          └──────┬──────┘
         │                       │
    ┌────┴─────┐          ┌──────┴──────┐
    │PostgreSQL│          │ ClickSend   │
    │          │          │ Resend      │
    │          │          │ Stripe      │
    └──────────┘          └─────────────┘
```

### Technology Stack

#### Frontend
```javascript
// Web Application
{
  framework: "React 18 + TypeScript",
  ui: "Shadcn/ui + Tailwind CSS",
  state: "Zustand",
  routing: "React Router v6",
  forms: "React Hook Form + Zod",
  data: "TanStack Query",
  charts: "Recharts",
  testing: "Jest + React Testing Library"
}

// PWA Application
{
  framework: "React 18 + TypeScript",
  offline: "Workbox",
  storage: "IndexedDB (Dexie.js)",
  ui: "Tailwind CSS",
  notifications: "Web Push API",
  location: "Geolocation API",
  sensors: "DeviceMotion API"
}
```

#### Backend
```javascript
// Supabase Configuration
{
  database: "PostgreSQL",
  auth: "Supabase Auth",
  realtime: "Supabase Realtime",
  storage: "Supabase Storage",
  functions: "Edge Functions",
  hosting: "Supabase Hosting"
}

// External Services
{
  sms: {
    primary: "ClickSend",
    fallback: "Twilio"
  },
  email: "Resend",
  payments: "Stripe",
  monitoring: "Sentry",
  analytics: "Plausible",
  status: "Better Uptime"
}
```

### API Design

#### RESTful Endpoints
```
Organizations:
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:id
PUT    /api/organizations/:id
DELETE /api/organizations/:id

Users:
GET    /api/users
POST   /api/users/invite
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

Check-ins:
GET    /api/checkins
POST   /api/checkins
GET    /api/checkins/:id
POST   /api/checkins/:id/acknowledge

Schedules:
GET    /api/schedules
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id

Incidents:
GET    /api/incidents
POST   /api/incidents
PUT    /api/incidents/:id/resolve
```

#### Real-time Subscriptions
```javascript
// Supabase Realtime Channels
const checkInChannel = supabase
  .channel('org-123-checkins')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'check_ins',
    filter: 'organization_id=eq.123'
  }, handleCheckInUpdate)
  .subscribe()

// Presence for online status
const presenceChannel = supabase
  .channel('org-123-presence')
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .subscribe()
```

## Database Schema

### Core Tables

```sql
-- Organizations (Multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  logo_url TEXT,
  status VARCHAR(50) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  profile JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email),
  UNIQUE(phone)
);

-- Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  schedule_id UUID REFERENCES schedules(id),
  status VARCHAR(50) NOT NULL,
  location GEOGRAPHY(POINT),
  due_at TIMESTAMP NOT NULL,
  checked_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_check_ins_status (organization_id, status, due_at)
);

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  check_in_interval INTEGER NOT NULL,
  start_time TIME,
  end_time TIME,
  active_days JSONB DEFAULT '[]',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedule Assignments
CREATE TABLE schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id),
  user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

-- Escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  schedule_id UUID REFERENCES schedules(id),
  level INTEGER NOT NULL,
  delay_minutes INTEGER NOT NULL,
  actions JSONB DEFAULT '[]',
  contacts JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  check_in_id UUID REFERENCES check_ins(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  escalation_level INTEGER DEFAULT 0,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  ));

-- Check-ins: Users can only see check-ins from their organization
CREATE POLICY "Users can view organization check-ins"
  ON check_ins FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  ));

-- Messages: Users can only see messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid()
  );
```

## Security & Compliance

### Security Measures

#### Authentication & Authorization
- Multi-factor authentication for admins
- Phone number verification for workers
- JWT tokens with short expiry
- Role-based access control (RBAC)
- API rate limiting
- Session management

#### Data Protection
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Location data anonymization options
- Automatic data retention policies
- GDPR-compliant data export/deletion

#### Infrastructure Security
- WAF protection
- DDoS mitigation
- Regular security audits
- Penetration testing
- SOC 2 Type II compliance
- ISO 27001 certification (planned)

### Compliance Features

#### Audit Trail
```javascript
// Every action logged with:
{
  userId: "uuid",
  action: "check_in.created",
  timestamp: "2025-01-20T10:30:00Z",
  metadata: {
    checkInId: "uuid",
    location: "encrypted",
    device: "iOS PWA"
  }
}
```

#### Reporting Requirements
- OSHA compliance reports
- Insurance documentation
- Incident investigation reports
- Worker hour tracking
- Safety training records

### Privacy Controls
- Opt-in location tracking
- Data minimization
- Right to erasure (GDPR)
- Data portability
- Privacy policy acceptance tracking

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)
**Goal**: Basic functional system

**Deliverables**:
- [ ] Supabase setup with basic schema
- [ ] Authentication system (email/phone)
- [ ] Organization and user management
- [ ] Basic check-in functionality
- [ ] Simple admin dashboard
- [ ] Basic PWA with offline storage

**Success Criteria**:
- Can create organization account
- Can invite and authenticate workers
- Workers can perform check-ins
- Admins can view check-in status

### Phase 2: Core Safety Features (Weeks 5-8)
**Goal**: Complete safety monitoring system

**Deliverables**:
- [ ] Schedule management system
- [ ] Multi-level escalation chains
- [ ] SMS/Email notifications
- [ ] Real-time dashboard updates
- [ ] Incident management
- [ ] Basic reporting

**Success Criteria**:
- Automated check-in reminders work
- Escalations trigger correctly
- 99% notification delivery rate
- <30 second dashboard updates

### Phase 3: Advanced Features (Weeks 9-12)
**Goal**: Production-ready platform

**Deliverables**:
- [ ] Public website with SEO
- [ ] Stripe billing integration
- [ ] Advanced analytics
- [ ] Two-way messaging
- [ ] Man down detection
- [ ] Compliance reporting
- [ ] API documentation

**Success Criteria**:
- Can process payments
- SEO rankings improving
- API response time <200ms
- 95% customer satisfaction

### Phase 4: Scale & Polish (Weeks 13-16)
**Goal**: Launch-ready product

**Deliverables**:
- [ ] Performance optimization
- [ ] Security audit completion
- [ ] Load testing (1000+ concurrent users)
- [ ] Documentation complete
- [ ] Support system setup
- [ ] Marketing site complete

**Success Criteria**:
- Page load time <2 seconds
- Pass security audit
- Handle 10,000 check-ins/hour
- 99.9% uptime achieved

### Post-Launch Roadmap

**Version 1.1 (Month 2-3)**:
- Wearable device integration
- Advanced scheduling (shifts, rotations)
- Multi-language support (Spanish, French)
- White-label customization

**Version 1.2 (Month 4-5)**:
- AI-powered anomaly detection
- Video check-ins
- Integration marketplace
- Advanced analytics dashboard

**Version 2.0 (Month 6+)**:
- Machine learning risk prediction
- IoT sensor integration
- Blockchain audit trails
- Global expansion features

## Success Metrics

### Technical KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | 99.9% | Monthly average |
| API Response Time | <200ms | 95th percentile |
| Check-in Processing | <2 sec | End-to-end |
| SMS Delivery Rate | >98% | Daily average |
| PWA Install Rate | >80% | Of invited workers |
| Offline Sync Success | >95% | When reconnected |

### Business KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial Conversion | >25% | 7-day to paid |
| Monthly Churn | <5% | Paid accounts |
| User Activation | >90% | Within 48 hours |
| NPS Score | >50 | Quarterly survey |
| Support Tickets | <2% | Of active users |
| Feature Adoption | >60% | Core features |

### Safety KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Incident Response | <2 min | Alert to action |
| Check-in Compliance | >95% | On-time rate |
| False Positive Rate | <10% | Of escalations |
| Incident Resolution | <30 min | Average time |
| Worker Satisfaction | >4.5/5 | App store rating |

## Appendix

### A. Technology Decisions

**Why Supabase?**
- Built-in auth and real-time
- PostgreSQL flexibility
- Row Level Security
- Cost-effective scaling
- Great developer experience

**Why PWA over Native?**
- Single codebase
- No app store delays
- Instant updates
- Lower development cost
- Works on all devices

**Why React?**
- Large ecosystem
- Component reusability
- Strong TypeScript support
- Excellent performance
- Team familiarity

### B. Competitive Analysis

| Feature | SafePing | Competitor A | Competitor B |
|---------|----------|--------------|--------------|
| Offline Capable | ✓ | ✗ | Partial |
| SMS Fallback | ✓ | ✓ | ✗ |
| Free Trial | 7 days | 14 days | ✗ |
| Starting Price | $4.90 | $7.99 | $5.99 |
| Setup Time | <5 min | 30 min | 15 min |
| Man Down Detection | ✓ | Premium | ✓ |
| API Access | ✓ | Premium | ✗ |

### C. Risk Mitigation

**Technical Risks**:
- PWA limitations on iOS → Provide native wrapper option
- SMS delivery failures → Multiple provider fallback
- Scaling issues → Auto-scaling infrastructure
- Data loss → Real-time replication + backups

**Business Risks**:
- Low trial conversion → Extended trial option
- High competition → Focus on simplicity
- Regulatory changes → Flexible compliance system
- Customer churn → Proactive success management

### D. Example Code Snippets

#### Check-in Component (PWA)
```jsx
function CheckInScreen() {
  const [loading, setLoading] = useState(false);
  const { user, schedule } = useAuth();
  
  const handleCheckIn = async (status: 'ok' | 'sos') => {
    setLoading(true);
    
    const location = await getCurrentLocation();
    const checkIn = {
      userId: user.id,
      status,
      location,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Try online first
      await submitCheckIn(checkIn);
    } catch (error) {
      // Queue for offline sync
      await queueOfflineCheckIn(checkIn);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="flex flex-col h-screen bg-white p-4">
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-center mb-8">
          Time until next check-in: {getTimeUntilNext(schedule)}
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => handleCheckIn('ok')}
            disabled={loading}
            className="w-full py-8 bg-green-500 text-white text-3xl font-bold rounded-lg"
          >
            I'm OK ✓
          </button>
          
          <button
            onClick={() => handleCheckIn('sos')}
            disabled={loading}
            className="w-full py-8 bg-red-500 text-white text-3xl font-bold rounded-lg"
          >
            Send Help!
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Escalation Handler (Backend)
```javascript
// Edge Function for escalation handling
export async function handleEscalation(checkInId: string) {
  const checkIn = await getCheckIn(checkInId);
  const escalationRules = await getEscalationRules(checkIn.scheduleId);
  
  for (const rule of escalationRules) {
    const overdue = Date.now() - checkIn.dueAt;
    const overdueMinutes = Math.floor(overdue / 60000);
    
    if (overdueMinutes >= rule.delayMinutes) {
      await executeEscalationLevel(checkIn, rule);
    }
  }
}

async function executeEscalationLevel(checkIn: CheckIn, rule: EscalationRule) {
  const incident = await createIncident({
    checkInId: checkIn.id,
    userId: checkIn.userId,
    escalationLevel: rule.level,
    type: 'overdue_checkin'
  });
  
  // Execute each action in the escalation
  for (const action of rule.actions) {
    switch (action) {
      case 'sms':
        await sendSMS(rule.contacts, {
          message: `ALERT: ${checkIn.userName} is ${rule.delayMinutes} minutes overdue for check-in.`,
          location: checkIn.lastKnownLocation
        });
        break;
        
      case 'call':
        await initiateCall(rule.contacts, {
          message: 'Worker overdue for safety check-in'
        });
        break;
        
      case 'push':
        await sendPushNotification(checkIn.userId, {
          title: 'Check-in Required',
          body: 'You are overdue for your safety check-in',
          urgency: 'high'
        });
        break;
    }
  }
  
  // Log escalation in incident timeline
  await updateIncidentTimeline(incident.id, {
    action: 'escalation_executed',
    level: rule.level,
    timestamp: new Date().toISOString()
  });
}
```

### E. Marketing Website Examples

#### Hero Section Design
```html
<!-- Homepage Hero -->
<section class="bg-gradient-to-br from-orange-50 to-white py-20">
  <div class="container mx-auto px-4">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-5xl font-bold text-gray-900 mb-6">
          Never Leave Your Lone Workers 
          <span class="text-orange-500">Truly Alone</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          Automated check-ins, instant alerts, and real-time monitoring 
          keep your remote workers safe and your business compliant.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <button class="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
            Start 7-Day Free Trial
          </button>
          <button class="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition">
            Watch 2-Min Demo
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-4">
          No credit card required • Setup in 5 minutes
        </p>
      </div>
      <div class="relative">
        <img src="/hero-dashboard.png" alt="SafePing Dashboard" class="rounded-lg shadow-2xl" />
        <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600"><!-- Check icon --></svg>
            </div>
            <div>
              <p class="font-semibold">Worker checked in</p>
              <p class="text-sm text-gray-500">John D. • 2 min ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

#### Pricing Component
```jsx
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$4.90',
      unit: 'per worker/month',
      features: [
        'Up to 10 workers',
        'Basic check-in schedules',
        '2-level escalation',
        'Email support',
        '100 SMS credits/month',
        'Basic reporting'
      ],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$3.90',
      unit: 'per worker/month',
      features: [
        '11-50 workers',
        'Advanced scheduling',
        '3-level escalation',
        'Priority support',
        '500 SMS credits/month',
        'Compliance reports',
        'API access'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      unit: 'Let\'s talk',
      features: [
        '50+ workers',
        'Custom features',
        'Unlimited escalation levels',
        'Dedicated support',
        'Unlimited SMS credits',
        'White-label options',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            No setup fees. No hidden costs. Just per-worker pricing.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                bg-white rounded-lg p-8 
                ${plan.highlighted ? 'ring-2 ring-orange-500 shadow-xl' : 'shadow-lg'}
              `}
            >
              {plan.highlighted && (
                <div className="bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600 ml-2">{plan.unit}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5">
                      <!-- Check icon -->
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={`
                  w-full py-3 rounded-lg font-semibold transition
                  ${plan.highlighted 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### F. Integration Examples

#### Stripe Subscription Setup
```javascript
// Create Stripe customer on org signup
export async function createStripeCustomer(org: Organization) {
  const customer = await stripe.customers.create({
    email: org.billingEmail,
    name: org.name,
    metadata: {
      organizationId: org.id
    }
  });
  
  // Store customer ID
  await updateOrganization(org.id, {
    stripeCustomerId: customer.id
  });
  
  // Create trial subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: org.workerCount
    }],
    trial_period_days: 7,
    metadata: {
      organizationId: org.id
    }
  });
  
  return subscription;
}

// Handle subscription updates
export async function updateWorkerCount(orgId: string, newCount: number) {
  const org = await getOrganization(orgId);
  const subscription = await stripe.subscriptions.retrieve(org.subscriptionId);
  
  await stripe.subscriptions.update(subscription.id, {
    items: [{
      id: subscription.items.data[0].id,
      quantity: newCount
    }]
  });
}
```

#### ClickSend SMS Integration
```javascript
// SMS notification service
export class SMSService {
  private client: ClickSend;
  private fallbackClient: Twilio;
  
  async sendAlert(to: string, message: string, urgent: boolean = false) {
    const smsBody = {
      messages: [{
        to: to,
        body: message,
        from: process.env.SMS_FROM_NUMBER,
        custom_string: urgent ? 'urgent' : 'normal'
      }]
    };
    
    try {
      // Try primary provider
      const result = await this.client.sms.send(smsBody);
      await this.logSMS(to, message, 'clicksend', result);
      return result;
    } catch (error) {
      // Fallback to Twilio
      console.error('ClickSend failed, using Twilio', error);
      
      const result = await this.fallbackClient.messages.create({
        to: to,
        from: process.env.TWILIO_FROM_NUMBER,
        body: message,
        statusCallback: process.env.SMS_WEBHOOK_URL
      });
      
      await this.logSMS(to, message, 'twilio', result);
      return result;
    }
  }
  
  private async logSMS(to: string, message: string, provider: string, result: any) {
    await createAuditLog({
      action: 'sms.sent',
      metadata: {
        to: to.slice(0, -4) + '****', // Partial number for privacy
        provider: provider,
        messageId: result.messageId,
        credits: result.credits || 1
      }
    });
  }
}
```

### G. PWA Implementation Details

#### Service Worker Configuration
```javascript
// sw.js - Service Worker for offline functionality
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60 // Retry for 24 hours
      })
    ]
  })
);

// Handle check-in submissions when offline
self.addEventListener('sync', event => {
  if (event.tag === 'check-in-sync') {
    event.waitUntil(syncCheckIns());
  }
});

async function syncCheckIns() {
  const db = await openDB('safeping', 1);
  const tx = db.transaction('pending-checkins', 'readonly');
  const checkins = await tx.store.getAll();
  
  for (const checkin of checkins) {
    try {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin)
      });
      
      // Remove from pending
      await db.delete('pending-checkins', checkin.id);
    } catch (error) {
      console.error('Failed to sync check-in:', error);
    }
  }
}

// Push notification handling
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'check-in', title: "I'm OK" },
      { action: 'help', title: 'Send Help' }
    ],
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'check-in') {
    // Quick check-in from notification
    event.waitUntil(
      clients.openWindow('/checkin?status=ok&quick=true')
    );
  } else if (event.action === 'help') {
    // Emergency SOS
    event.waitUntil(
      clients.openWindow('/checkin?status=sos&quick=true')
    );
  }
});
```

#### PWA Manifest
```json
{
  "name": "SafePing Worker Safety",
  "short_name": "SafePing",
  "description": "Stay safe with regular check-ins",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["business", "safety", "productivity"],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Check In",
      "short_name": "Check In",
      "url": "/checkin",
      "icons": [{ "src": "/checkin-icon.png", "sizes": "96x96" }]
    }
  ]
}
```

### H. Testing Strategy

#### Test Coverage Requirements
```javascript
// Unit Tests (Jest + React Testing Library)
describe('CheckInButton', () => {
  it('should submit check-in when clicked', async () => {
    const onCheckIn = jest.fn();
    render(<CheckInButton onCheckIn={onCheckIn} />);
    
    await userEvent.click(screen.getByText("I'm OK"));
    
    expect(onCheckIn).toHaveBeenCalledWith('ok');
  });
  
  it('should queue check-in when offline', async () => {
    mockOffline();
    render(<CheckInButton />);
    
    await userEvent.click(screen.getByText("I'm OK"));
    
    const queued = await getQueuedCheckIns();
    expect(queued).toHaveLength(1);
  });
});

// Integration Tests (Cypress)
describe('Worker Check-in Flow', () => {
  it('completes full check-in process', () => {
    cy.login('worker@example.com');
    cy.visit('/');
    
    // Wait for check-in to be due
    cy.clock();
    cy.tick(60 * 60 * 1000); // 1 hour
    
    // Should show notification
    cy.get('[data-cy=check-in-due]').should('be.visible');
    
    // Perform check-in
    cy.get('[data-cy=check-in-ok]').click();
    
    // Verify confirmation
    cy.contains('Check-in recorded').should('be.visible');
    
    // Verify dashboard update
    cy.task('checkDatabase', {
      table: 'check_ins',
      where: { status: 'ok' }
    }).should('have.length', 1);
  });
});

// Load Testing (k6)
export default function() {
  const params = {
    headers: { 'Authorization': `Bearer ${__ENV.API_TOKEN}` }
  };
  
  // Simulate 1000 concurrent check-ins
  const response = http.post(
    'https://api.safeping.novaly.app/checkins',
    JSON.stringify({
      userId: `user_${__VU}`,
      status: 'ok',
      location: { lat: 40.7128, lng: -74.0060 }
    }),
    params
  );
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
}

// PWA Testing Checklist
- [ ] Install prompt appears on supported browsers
- [ ] App installs successfully
- [ ] Icons display correctly
- [ ] Splash screen shows
- [ ] Offline mode works
- [ ] Push notifications received
- [ ] Background sync functions
- [ ] App updates without reinstall
```

## Conclusion

SafePing represents a comprehensive solution for lone worker safety, combining modern web technologies with proven safety protocols. The platform's focus on simplicity, reliability, and compliance positions it well for rapid market adoption.

The development approach emphasizes:
- **User Experience**: Simple interfaces for both workers and administrators
- **Reliability**: Offline capability and multiple fallback systems
- **Scalability**: Cloud-native architecture supporting thousands of users
- **Compliance**: Built-in features for regulatory requirements
- **Flexibility**: Customizable for various industries and use cases

By following this PRD, the development team can build a robust, market-ready product that genuinely improves worker safety while providing businesses with the tools they need for compliance and peace of mind.