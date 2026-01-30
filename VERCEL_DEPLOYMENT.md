# 🚀 Allergy Scribe - Vercel Deployment Guide

## 📋 Prerequisites

Before deploying to Vercel, make sure you have:

1. **GitHub Account**: Your code is already on GitHub at https://github.com/Pablodd1/Alergy-Med
2. **Vercel Account**: Sign up at https://vercel.com (free tier available)
3. **OpenAI API Key**: Get one at https://platform.openai.com/api-keys

## 🔧 Environment Variables Setup

Before deployment, update these environment variables in your Vercel dashboard:

### Required Variables:
- `OPENAI_API_KEY` = Your actual OpenAI API key
- `NEXTAUTH_SECRET` = Generate a secure random string (32+ characters)
- `NEXTAUTH_URL` = Your Vercel deployment URL (will be auto-updated)
- `DEFAULT_USERNAME` = Login username (change from demo)
- `DEFAULT_PASSWORD` = Login password (change from demo123)

### Optional (Set to defaults for demo):
- `OCR_PROVIDER` = mock
- `DEMO_MODE` = true

## 🚀 Deployment Steps

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Sign in with GitHub**: Use your GitHub account
3. **Import Project**: Click "New Project"
4. **Select Repository**: Choose "Pablodd1/Alergy-Med"
5. **Configure Environment Variables**: Add the variables from above
6. **Deploy**: Click "Deploy" button

### Option 2: Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /home/user/allergy-scribe
vercel --prod
```

### Option 3: GitHub Integration (Automatic)

1. **Install Vercel GitHub App**: Go to https://vercel.com/github
2. **Connect Repository**: Allow access to your repository
3. **Auto-deploy**: Every push to main branch will auto-deploy

## 📊 Post-Deployment

After successful deployment:

1. **Get your URL**: Will be like `https://allergy-scribe-xxxx.vercel.app`
2. **Update NEXTAUTH_URL**: In Vercel dashboard, set to your actual URL
3. **Test the app**: Visit your new URL and test functionality
4. **Change credentials**: Update DEFAULT_USERNAME and DEFAULT_PASSWORD

## 🔄 Continuous Deployment

With GitHub integration:
- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Rollback capability in Vercel dashboard

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**: Check environment variables are set correctly
2. **Authentication Issues**: Ensure NEXTAUTH_SECRET is 32+ characters
3. **OpenAI Errors**: Verify your API key and billing status
4. **Database Issues**: Set DEMO_MODE=true to avoid MongoDB setup

### Environment Variables Not Working?
- Double-check spelling and case sensitivity
- Ensure no extra spaces in variable names
- Try redeploying after making changes

## 📱 Features Available

Once deployed, your app will have:
- ✅ Medical note generation
- ✅ File upload and processing
- ✅ Transcription services
- ✅ User authentication
- ✅ Responsive design
- ✅ Production-ready performance

## 🎯 Next Steps

1. **Add your OpenAI API key** for full functionality
2. **Change default credentials** for security
3. **Set up custom domain** (optional)
4. **Monitor usage** in Vercel dashboard
5. **Share your app** with users!

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first: `npm run dev`
4. Check GitHub repository for updates

---

**Your app is ready for production deployment!** 🎉