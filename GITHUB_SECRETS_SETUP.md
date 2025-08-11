# GitHub Secrets Setup for DigitalOcean Deployment

This guide explains how to set up the required GitHub secrets for the SafePing deployment workflow to work with DigitalOcean.

## 🔑 Required GitHub Secrets

The deployment workflow requires the following secrets to be configured in your GitHub repository:

### 1. **DIGITALOCEAN_ACCESS_TOKEN**

- **What it is**: Your DigitalOcean API token for authentication
- **How to get it**:
  1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
  2. Click "Generate New Token"
  3. Give it a name (e.g., "SafePing Deployment")
  4. Select "Write" scope
  5. Copy the generated token

### 2. **DIGITALOCEAN_REGISTRY**

- **What it is**: Your DigitalOcean Container Registry name
- **How to get it**:
  1. Go to [DigitalOcean Container Registry](https://cloud.digitalocean.com/registry)
  2. Create a new registry if you don't have one
  3. Note the registry name (e.g., "safeping-registry")

## 📋 Setting Up GitHub Secrets

### Step 1: Go to Repository Settings

1. Navigate to your GitHub repository: `https://github.com/kiwidigitalnz/SafePing`
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add the Required Secrets

1. Click **New repository secret**
2. Add each secret:

#### Secret 1: DIGITALOCEAN_ACCESS_TOKEN

- **Name**: `DIGITALOCEAN_ACCESS_TOKEN`
- **Value**: Your DigitalOcean API token (starts with `dop_v1_...`)

#### Secret 2: DIGITALOCEAN_REGISTRY

- **Name**: `DIGITALOCEAN_REGISTRY`
- **Value**: Your container registry name (e.g., `safeping-registry`)

### Step 3: Verify Secrets

- You should see both secrets listed in the "Repository secrets" section
- The values will be masked with asterisks for security

## 🚀 How the Workflow Works

1. **On Push to Main**: The workflow automatically triggers when you push to the main branch
2. **Build Docker Image**: Creates a Docker image from your code
3. **Push to Registry**: Uploads the image to DigitalOcean Container Registry
4. **Auto-Deploy**: DigitalOcean automatically deploys the new image (configured in `.do/app.yaml`)

## 🔧 Troubleshooting

### Common Issues:

#### 1. **"Input required and not supplied: token"**

- **Cause**: Missing `DIGITALOCEAN_ACCESS_TOKEN` secret
- **Solution**: Add the secret as described above

#### 2. **"Failed to authenticate with registry"**

- **Cause**: Invalid or expired DigitalOcean token
- **Solution**: Generate a new token and update the secret

#### 3. **"Registry not found"**

- **Cause**: Incorrect `DIGITALOCEAN_REGISTRY` value
- **Solution**: Verify the registry name in DigitalOcean dashboard

#### 4. **"Permission denied"**

- **Cause**: Token doesn't have write permissions
- **Solution**: Ensure token has "Write" scope enabled

## 📱 Manual Deployment (Alternative)

If you prefer to deploy manually instead of using GitHub Actions:

1. **Local Build**: Run `docker build -t safeping-production .`
2. **Manual Push**: Use `doctl` to push to your registry
3. **App Update**: Update the DigitalOcean app manually

## 🔒 Security Notes

- **Never commit secrets to your repository**
- **Rotate your DigitalOcean token regularly**
- **Use the minimum required permissions for your token**
- **Monitor GitHub Actions logs for any exposed secrets**

## 📞 Support

If you continue to have issues:

1. Check the GitHub Actions logs for specific error messages
2. Verify your DigitalOcean account has the necessary permissions
3. Ensure your container registry is active and accessible

---

**Next Steps**: After setting up these secrets, your next push to main should trigger a successful deployment! 🎉
