# SafePing Domain Configuration Update

## Domain Structure

All SafePing services are now configured to use the following domain structure:

### Primary Domain: `safeping.app`

- **Main Application**: `https://safeping.app`
  - Admin dashboard
  - Organization management
  - Worker management
  - Landing pages
  - Authentication flows

- **Worker PWA**: `https://my.safeping.app`
  - Progressive Web App for workers
  - Mobile-first interface
  - Offline-capable
  - Biometric authentication
  - PIN-based security

- **API Endpoints**: `https://api.safeping.app`
  - Supabase Edge Functions
  - REST API
  - WebSocket connections

## Files Updated

### Configuration Files
1. **`packages/config/app.config.ts`**
   - Updated PWA URL to `https://my.safeping.app`
   - Centralized configuration for all app URLs

2. **`.env.production`**
   - `PWA_URL=https://my.safeping.app`
   - `WORKER_APP_URL=https://my.safeping.app`
   - Email from: `noreply@safeping.app`

3. **`DEPLOYMENT.md`**
   - Complete deployment guide with new domain structure
   - DNS configuration for `my.safeping.app` subdomain
   - CORS policies updated

### Edge Functions
1. **`supabase/functions/send-worker-invitation/index.ts`**
   - Invitation URLs now point to `https://my.safeping.app/invite/{token}`

2. **`supabase/functions/_shared/email.ts`**
   - Email from address: `noreply@safeping.app`
   - Dashboard links: `https://safeping.app/dashboard`

## DNS Configuration Required

Add these DNS records to your domain:

```
# Main domain
A     @              -> Your server IP
AAAA  @              -> Your server IPv6 (optional)

# Subdomains
CNAME my             -> Your PWA hosting service
CNAME api            -> Your API hosting service

# SSL certificates for all subdomains
```

## Environment Variables to Update

In your production environment, update:

```bash
# Core URLs
PUBLIC_SITE_URL=https://safeping.app
APP_URL=https://safeping.app
PWA_URL=https://my.safeping.app
API_URL=https://api.safeping.app

# Email Configuration
RESEND_FROM_EMAIL=noreply@safeping.app
RESEND_FROM_NAME=SafePing

# Worker App
WORKER_APP_URL=https://my.safeping.app
```

## Worker Invitation Flow

1. Admin invites worker from `https://safeping.app/workers/invite`
2. SMS sent with link to `https://my.safeping.app/invite/{token}`
3. Worker installs PWA from `https://my.safeping.app`
4. Worker authenticates and sets up PIN/biometric

## CORS Configuration

Update your CORS policies to allow:
- `https://safeping.app` → `https://api.safeping.app`
- `https://my.safeping.app` → `https://api.safeping.app`

## SSL/TLS Requirements

Ensure SSL certificates are configured for:
- `safeping.app` (main domain)
- `my.safeping.app` (worker PWA)
- `api.safeping.app` (API endpoints)

## Testing URLs

After deployment, test these endpoints:
- Main app: `https://safeping.app`
- Worker PWA: `https://my.safeping.app`
- API health: `https://api.safeping.app/health`

## Email Templates

All email templates now use:
- From: `noreply@safeping.app`
- Dashboard links: `https://safeping.app/dashboard`
- Worker app links: `https://my.safeping.app`

## Mobile App Access

Workers access the PWA via:
1. Direct URL: `https://my.safeping.app`
2. SMS invitation link
3. QR code (optional)

The PWA at `my.safeping.app` provides:
- iOS: Add to Home Screen via Safari
- Android: Install via Chrome/Edge
- Desktop: Install via supported browsers

## Support

For any issues with the domain configuration:
- Email: `support@safeping.app`
- Documentation: `https://safeping.app/docs`
