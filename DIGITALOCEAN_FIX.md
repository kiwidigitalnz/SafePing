# 🔧 DigitalOcean Single Instance Setup Fix

## ⚠️ Problem
DigitalOcean is auto-detecting 3 separate apps (landing, web, pwa) and trying to create 3 instances instead of 1 unified Docker container.

## ✅ Solution
We need to force DigitalOcean to use our Dockerfile approach which builds all 3 apps into a single container with Nginx routing.

## 📝 Setup Instructions

### Option 1: Manual Setup (Recommended)

1. **Go to DigitalOcean App Platform**
   - https://cloud.digitalocean.com/apps

2. **Click "Create App"**

3. **Choose GitHub Repository**
   - Select: `kiwidigitalnz/SafePing`
   - Branch: `main`

4. **IMPORTANT: Resource Configuration**
   - When DigitalOcean shows multiple resources detected, **DELETE** the extra ones
   - Keep only ONE resource
   - Click "Edit" on the remaining resource
   - Set:
     - Type: **Web Service**
     - Build: **Dockerfile**
     - Dockerfile Path: `Dockerfile`
     - Source Directory: `/`

5. **Configure the Single Service**
   - Name: `safeping`
   - HTTP Port: `80`
   - Instance Size: Basic ($4/month)
   - Instance Count: 1

6. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL = your_supabase_url
   VITE_SUPABASE_ANON_KEY = your_supabase_key
   VITE_GOOGLE_CLIENT_ID = your_google_client_id
   VITE_STRIPE_PUBLIC_KEY = your_stripe_key
   VITE_VAPID_PUBLIC_KEY = your_vapid_key
   ```

7. **Skip to Review**
   - Verify only 1 service is listed
   - Total should show 1 instance

### Option 2: Using App Spec File

1. **Use the simplified spec file**
   ```bash
   doctl apps create --spec .do/deploy.template.yaml
   ```

2. **Or import in dashboard**
   - Click "Create App"
   - Choose "DigitalOcean App Platform Spec"
   - Upload `.do/deploy.template.yaml`

## 🎯 What This Achieves

Instead of:
```
❌ 3 separate instances:
- safeping (landing) - Web Service
- safeping2 (web) - Web Service  
- safeping3 (pwa) - Function
```

You get:
```
✅ 1 unified instance:
- safeping - Web Service (serves all 3 apps via Nginx)
```

## 🔍 How It Works

1. **Single Dockerfile** builds all 3 apps
2. **Nginx** routes based on subdomain:
   - `safeping.app` → Landing page
   - `web.safeping.app` → Admin dashboard
   - `my.safeping.app` → Worker PWA
3. **One container** serves everything

## 🚨 Common Issues

### Still seeing 3 resources?
- Make sure to delete the auto-detected resources
- Explicitly choose "Dockerfile" as build type
- Set source directory to `/` (root)

### Build failing?
- Check environment variables are set
- Verify Dockerfile is in root directory
- Check build logs for specific errors

### Domains not working?
- Add all domains after app is created:
  - `safeping.app`
  - `www.safeping.app`
  - `web.safeping.app`
  - `my.safeping.app`

## 💡 Pro Tips

1. **Disable Auto-Deploy Initially**
   - Get the setup working first
   - Then enable auto-deploy from GitHub

2. **Start with Basic Instance**
   - $4/month is sufficient for testing
   - Scale up later if needed

3. **Test Locally First**
   ```bash
   docker build -t safeping .
   docker run -p 8080:80 safeping
   ```
   - Visit http://localhost:8080
   - Verify all apps load

## 📊 Cost Comparison

| Setup | Monthly Cost | Resources |
|-------|-------------|-----------|
| ❌ 3 Instances | $12+ | 3 separate containers |
| ✅ 1 Instance | $4 | 1 unified container |

## 🔄 After Setup

Once working:
1. Enable GitHub auto-deploy
2. Configure custom domains
3. Add SSL certificates
4. Set up monitoring

## 📞 Need Help?

If still seeing multiple instances:
1. Delete the app completely
2. Start fresh with manual setup
3. Explicitly choose Dockerfile option
4. Ensure only 1 service before deploying

Remember: The goal is ONE Docker container serving THREE apps via Nginx subdomain routing!
