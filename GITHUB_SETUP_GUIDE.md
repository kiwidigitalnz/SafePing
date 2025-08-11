# 🔧 GitHub Repository Setup Guide for SafePing

This guide will help you configure your GitHub repository for automatic deployments to DigitalOcean.

## 📍 Repository Information

- **Repository URL**: https://github.com/kiwidigitalnz/SafePing
- **Default Branch**: `main`
- **Visibility**: Public

## 🔐 Required GitHub Secrets

You need to add the following secrets to your GitHub repository for automatic deployments to work.

### How to Add Secrets

1. Go to your repository: https://github.com/kiwidigitalnz/SafePing
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret below

### Required Secrets

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API token | [Create token](https://cloud.digitalocean.com/account/api/tokens) with read/write scope |
| `DIGITALOCEAN_APP_ID` | Your app's ID | Get from DigitalOcean App Platform dashboard |
| `DIGITALOCEAN_REGISTRY` | Container registry name | Create in DigitalOcean → Container Registry |

### Optional Secrets (for enhanced features)

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | For deployment notifications | Create in Slack workspace settings |
| `SENTRY_AUTH_TOKEN` | For source map uploads | Get from Sentry project settings |

## 🚀 Automatic Deployment Setup

### 1. GitHub Actions Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Triggers on every push to `main` branch
- Builds Docker image
- Pushes to DigitalOcean Container Registry
- Deploys to App Platform

### 2. Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. If prompted, enable GitHub Actions
3. The workflow will run automatically on next push

### 3. Manual Deployment Trigger

You can also trigger deployment manually:
1. Go to **Actions** tab
2. Select **Deploy to DigitalOcean** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## 🔄 Deployment Process

When you push to the `main` branch:

1. **GitHub Actions triggered** → Build starts
2. **Docker image built** → Using Dockerfile in repo
3. **Image pushed** → To DigitalOcean Container Registry
4. **App updated** → DigitalOcean App Platform deploys new version
5. **Domains updated** → SSL certificates auto-renewed if needed

## 📝 Branch Protection (Recommended)

To prevent accidental deployments, set up branch protection:

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## 🏷️ Version Tagging

For production releases, create version tags:

```bash
# Create a version tag
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0

# List all tags
git tag -l

# Create release on GitHub
gh release create v1.0.0 --title "Version 1.0.0" --notes "Initial production release"
```

## 📊 Monitoring Deployments

### GitHub Actions Dashboard
- View deployment status: https://github.com/kiwidigitalnz/SafePing/actions
- Check build logs for errors
- Monitor deployment duration

### DigitalOcean Dashboard
- App Platform: View deployment progress
- Activity logs: Check for deployment events
- Metrics: Monitor app performance

## 🔔 Deployment Notifications

### Email Notifications
GitHub automatically sends emails for:
- Failed deployments
- Successful deployments (if configured)

### Slack Integration (Optional)
Add Slack notifications by updating the workflow:
1. Add `SLACK_WEBHOOK_URL` secret
2. Add notification step to workflow

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**
   - Check GitHub Actions logs
   - Verify Dockerfile syntax
   - Ensure all dependencies are listed

2. **Deployment Fails**
   - Verify DigitalOcean secrets are correct
   - Check DigitalOcean app logs
   - Ensure domains are configured

3. **Secrets Not Working**
   - Verify secret names match exactly
   - Regenerate tokens if expired
   - Check secret scope/permissions

### Debug Mode

Enable debug logging in GitHub Actions:
1. Add secret: `ACTIONS_STEP_DEBUG` = `true`
2. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Docker Hub Documentation](https://docs.docker.com/)

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate API tokens** regularly
3. **Use environment-specific** branches
4. **Enable 2FA** on GitHub account
5. **Audit deployment logs** regularly

## 📞 Support

For deployment issues:
- GitHub Actions: Check [GitHub Status](https://www.githubstatus.com/)
- DigitalOcean: Contact support or check [status page](https://status.digitalocean.com/)
- Repository issues: Create an issue in the repo

---

## Quick Commands Reference

```bash
# Clone repository
git clone https://github.com/kiwidigitalnz/SafePing.git

# Create feature branch
git checkout -b feature/your-feature

# Push changes
git add .
git commit -m "Your commit message"
git push origin feature/your-feature

# Create pull request
gh pr create --title "Your PR title" --body "Description"

# Merge to main (triggers deployment)
gh pr merge --merge

# Check deployment status
gh run list
gh run view
```

Remember: Every push to `main` triggers automatic deployment to production!
