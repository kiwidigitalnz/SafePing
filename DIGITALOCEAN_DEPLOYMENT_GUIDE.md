# 🚀 SafePing DigitalOcean Deployment Guide

This guide will walk you through deploying SafePing as a unified application on DigitalOcean App Platform using GitHub integration.

## 📋 Prerequisites

1. **Domain**: Register `safeping.app` domain
2. **DigitalOcean Account**: Create an account at [digitalocean.com](https://digitalocean.com)
3. **GitHub Repository**: Push your code to GitHub
4. **Supabase Project**: Set up a production Supabase project
5. **Google OAuth**: Configure OAuth credentials
6. **Stripe Account**: Set up Stripe for payments
7. **ClickSend Account**: For SMS functionality

## 🏗️ Architecture Overview

We deploy everything as a **single DigitalOcean App** using Docker and Nginx:

```
safeping.app          → Landing Page
web.safeping.app      → Admin Dashboard  
my.safeping.app       → Worker PWA
```

All three applications are built into a single Docker container and served via Nginx with subdomain routing.

## 📝 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Update GitHub username in app spec**:
   ```bash
   # Edit .do/app.yaml
   # Replace YOUR_GITHUB_USERNAME with your actual GitHub username
   ```

2. **Commit deployment files**:
   ```bash
   git add .
   git commit -m "Add DigitalOcean deployment configuration"
   git push origin main
   ```

### Step 2: Configure External Services

#### Supabase Setup
1. Create a new Supabase project for production
2. Run all migrations in `supabase/migrations/`
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy --project-ref your-project-ref
   ```
4. Update allowed URLs:
   - Site URL: `https://web.safeping.app`
   - Redirect URLs: `https://web.safeping.app/auth/callback`

#### Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update OAuth 2.0 Client:
   - Authorized JavaScript origins:
     - `https://web.safeping.app`
     - `https://safeping.app`
   - Authorized redirect URIs:
     - `https://web.safeping.app/auth/callback`

#### ClickSend SMS Setup
1. Verify your ClickSend account
2. Get your API credentials
3. Add verified sender number

### Step 3: Deploy to DigitalOcean

#### Option A: Using DigitalOcean CLI (doctl)

1. **Install doctl**:
   ```bash
   # macOS
   brew install doctl
   
   # Linux
   snap install doctl
   ```

2. **Authenticate**:
   ```bash
   doctl auth init
   ```

3. **Deploy the app**:
   ```bash
   # Run the deployment script
   ./scripts/deploy-production.sh
   
   # Select option 5 for full deployment
   ```

#### Option B: Using DigitalOcean Dashboard

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository and branch
5. Choose "Dockerfile" as the build option
6. Configure app settings:
   - Name: `safeping-production`
   - Region: Choose closest to your users
   - Instance: Basic ($12/month)

### Step 4: Configure Environment Variables

In DigitalOcean App Platform settings, add these environment variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-key

# Analytics (optional)
GA_TRACKING_ID=G-XXXXXXXXXX
```

### Step 5: Configure Domains

1. **In DigitalOcean App Settings**:
   - Add domain: `safeping.app`
   - Add domain: `www.safeping.app`
   - Add domain: `web.safeping.app`
   - Add domain: `my.safeping.app`

2. **Update DNS Records** (at your domain registrar):
   ```
   Type  Name    Value
   A     @       DigitalOcean IP
   CNAME www     safeping.app
   CNAME web     safeping.app
   CNAME my      safeping.app
   ```

3. **Wait for SSL Certificates**:
   - DigitalOcean automatically provisions Let's Encrypt certificates
   - This may take 10-15 minutes

### Step 6: Configure Supabase Edge Functions

Update environment variables for Edge Functions:

```bash
# In Supabase Dashboard > Edge Functions > Settings
CLICKSEND_USERNAME=your-username
CLICKSEND_API_KEY=your-api-key
RESEND_API_KEY=your-resend-key
APP_URL=https://web.safeping.app
PWA_URL=https://my.safeping.app
```

### Step 7: Test Your Deployment

1. **Test each subdomain**:
   - Landing: https://safeping.app
   - Dashboard: https://web.safeping.app
   - PWA: https://my.safeping.app

2. **Test critical flows**:
   - User registration
   - Google OAuth login
   - Staff invitation SMS
   - PWA installation

## 🔧 Troubleshooting

### Build Failures
- Check build logs in DigitalOcean dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Domain Issues
- Verify DNS propagation: `nslookup safeping.app`
- Check SSL certificate status in DigitalOcean
- Ensure domains are correctly added in app settings

### Environment Variables
- Double-check all required variables are set
- Ensure no trailing spaces in values
- Verify Supabase URL includes `https://`

### Nginx Routing
- Check nginx logs: App Platform > Logs > Runtime
- Verify server_name directives match your domains
- Test locally with Docker first

## 📊 Monitoring

### Health Checks
- Landing: https://safeping.app
- Dashboard: https://web.safeping.app
- PWA: https://my.safeping.app
- Health endpoint: https://safeping.app/health

### Logs
Access logs in DigitalOcean dashboard:
- Build logs
- Deploy logs
- Runtime logs

### Metrics
Monitor in DigitalOcean dashboard:
- CPU usage
- Memory usage
- Bandwidth
- Response times

## 🔄 Updating Your App

### Automatic Deployments
With GitHub integration, pushing to your main branch automatically triggers a deployment.

### Manual Deployments
```bash
# Using the deployment script
./scripts/deploy-production.sh

# Or using doctl
doctl apps create-deployment <app-id>
```

## 💰 Cost Optimization

### Current Setup
- **Basic Plan**: ~$12/month
- Includes: 1 vCPU, 512MB RAM, 10GB bandwidth

### Scaling Options
- **Professional**: $24/month (1 vCPU, 1GB RAM)
- **Multiple instances**: Add for high availability
- **CDN**: Use Cloudflare for static assets

## 🔐 Security Checklist

- [ ] Environment variables secured in DigitalOcean
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx
- [ ] Supabase RLS policies enabled
- [ ] API keys rotated regularly

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## 🆘 Support

If you encounter issues:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review DigitalOcean app logs
3. Contact support@safeping.app

---

## Quick Deploy Commands

```bash
# Full deployment
./scripts/deploy-production.sh

# Test locally first
docker build -t safeping .
docker run -p 8080:80 safeping

# Deploy with doctl
doctl apps create --spec .do/app.yaml

# Update existing app
doctl apps update <app-id> --spec .do/app.yaml
```

## Environment Variables Reference

```bash
# Required for all apps
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Web Dashboard specific
VITE_GOOGLE_CLIENT_ID=xxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx

# PWA specific
VITE_VAPID_PUBLIC_KEY=xxx

# Optional
VITE_GA_TRACKING_ID=G-xxx
```

Remember to update these values with your actual credentials before deployment!
