# SafePing Deployment Configuration

## Production Domain: safeping.app

### URL Structure

- **Landing Page**: https://safeping.app
  - Marketing website
  - Product information
  - Pricing plans
  - Sign up/Login links

- **Admin Dashboard**: https://web.safeping.app
  - Organization management
  - Worker management interface
  - Check-in monitoring
  - Escalation configuration
  - Billing and subscriptions

- **Worker PWA**: https://my.safeping.app
  - Progressive Web App for workers
  - Mobile-optimized interface
  - Offline-capable check-in system
  - Biometric authentication
  - PIN-based security

- **API Endpoints**: Hosted on Supabase
  - Edge Functions
  - REST API endpoints
  - WebSocket connections

### Email Configuration

All emails are sent from the `safeping.app` domain:
- **From Address**: noreply@safeping.app
- **Support Email**: support@safeping.app
- **Reply-To**: support@safeping.app

Email templates automatically link to:
- Dashboard: https://safeping.app/dashboard
- Worker invitations: https://my.safeping.app/invite
- Password reset: https://safeping.app/auth/reset-password
- Email verification: https://safeping.app/auth/verify

### SMS Configuration

SMS messages for worker invitations include links to:
- Worker app: https://my.safeping.app
- Invitation acceptance: https://my.safeping.app/invite?token={token}

### DNS Requirements

Required DNS records for safeping.app:

```
# Main domain
A     @              -> Your server IP
AAAA  @              -> Your server IPv6 (optional)

# Subdomains
CNAME my             -> Your PWA hosting
CNAME api            -> Your API hosting

# Email (if using custom email)
MX    @              -> Your mail server
TXT   @              -> SPF record
TXT   _dmarc         -> DMARC policy
TXT   default._domainkey -> DKIM key

# SSL/TLS
CAA   @              -> Certificate authority
```

### Environment Variables

Update these in your production environment:

```bash
# Core URLs
PUBLIC_SITE_URL=https://safeping.app
APP_URL=https://safeping.app
PWA_URL=https://my.safeping.app
API_URL=https://api.safeping.app

# Email
RESEND_FROM_EMAIL=noreply@safeping.app
RESEND_FROM_NAME=SafePing

# OAuth Callbacks
GOOGLE_REDIRECT_URI=https://safeping.app/auth/callback
```

### Deployment Steps

1. **Domain Setup**
   - Register safeping.app domain
   - Configure DNS records
   - Set up SSL certificates (Let's Encrypt recommended)

2. **Hosting Configuration**
   - Main app: Deploy to Vercel/Netlify at safeping.app
   - PWA: Deploy to my.safeping.app subdomain
   - Configure CORS for cross-origin requests

3. **Supabase Configuration**
   - Update Site URL to https://safeping.app
   - Add redirect URLs for OAuth
   - Configure Edge Function environment variables

4. **Email Service (Resend)**
   - Verify safeping.app domain
   - Configure DNS records for email
   - Update from address to noreply@safeping.app

5. **SSL/Security**
   - Enable HTTPS on all domains
   - Configure security headers
   - Set up CSP policies

### Mobile App Distribution

The PWA at my.safeping.app is optimized for:
- **iOS**: Add to Home Screen via Safari
- **Android**: Install via Chrome/Edge
- **Desktop**: Install via Chrome/Edge

Workers access the app via:
1. SMS invitation link
2. Direct URL: https://my.safeping.app
3. QR code scanning

### Monitoring

Monitor these endpoints:
- Health check: https://api.safeping.app/health
- Main site: https://safeping.app
- PWA: https://my.safeping.app

### Backup Domains (Optional)

Consider registering these for brand protection:
- safeping.com
- safeping.io
- safeping.net

### CDN Configuration

Static assets served from:
- Images: https://safeping.app/assets/
- PWA assets: https://my.safeping.app/assets/

### Analytics

Track separately:
- Main site: GA property for safeping.app
- PWA: GA property for my.safeping.app
- API: Server-side analytics

## Security Considerations

1. **CORS Policy**
   - Allow my.safeping.app to access api.safeping.app
   - Block other origins by default

2. **Content Security Policy**
   - Restrict script sources
   - Limit frame ancestors
   - Enforce HTTPS

3. **Rate Limiting**
   - API endpoints: 100 requests/minute
   - Auth endpoints: 10 attempts/hour
   - SMS sending: 5 per phone/day

## Support

For deployment assistance:
- Email: support@safeping.app
- Documentation: https://safeping.app/docs
- Status Page: https://status.safeping.app
