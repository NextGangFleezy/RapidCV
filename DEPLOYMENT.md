# Deployment Guide

## GitHub Setup

### 1. Initialize and Push to GitHub

```bash
# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: RapidCV resume builder with flat folder structure"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/rapidcv.git

# Push to GitHub
git push -u origin main
```

### 2. Environment Variables Setup

Before deploying, you'll need to set up these environment variables:

#### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Email/Password method
4. Add your domain to authorized domains
5. Get these values from Project Settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

#### Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Generate an API key
3. Set as `ANTHROPIC_API_KEY`

## Vercel Deployment

### 1. Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure as follows:
   - Framework Preset: **Other**
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

### 2. Environment Variables in Vercel
Add these environment variables in Vercel dashboard:
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Post-Deployment Setup

### Firebase Authorized Domains
1. Go to Firebase Console > Authentication > Settings > Authorized Domains
2. Add your Vercel domain: `your-project.vercel.app`
3. Add any custom domains you plan to use

### Testing
1. Test user registration and login
2. Test resume builder functionality
3. Test AI features (cover letter and job analysis)
4. Test PDF export

## Troubleshooting

### Build Errors
- Check that all environment variables are set correctly
- Ensure Node.js version compatibility (18+)
- Verify all dependencies are in package.json

### Authentication Issues
- Verify Firebase configuration
- Check authorized domains in Firebase console
- Ensure API keys are correct and active

### AI Features Not Working
- Verify Anthropic API key is set and valid
- Check API usage limits
- Review error logs in Vercel dashboard