# Deploy to Vercel - Complete Guide

Your PWA-enabled ClipShare app is ready for Vercel deployment!

## Quick Deploy (Recommended)

### Option 1: Deploy via GitHub
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add PWA support"
   git push origin pwa
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI
1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

## What's Configured for Vercel:

✅ **Service Worker** (`public/sw.js`)
   - Automatically served from `/sw.js`
   - No build step required

✅ **Manifest** (`public/manifest.json`)
   - Accessible at `/manifest.json`
   - All icons properly configured

✅ **Vercel Headers** (`vercel.json`)
   - Service worker headers configured
   - Cache control optimized
   - Security headers added

✅ **HTTPS** 
   - Automatic on Vercel
   - Required for PWA to work

✅ **PWA Install Prompt**
   - Works automatically on deployed URL
   - Handles all browsers

## After Deployment:

### Test Your PWA:
1. Open your deployed URL (e.g., `https://your-app.vercel.app`)
2. You should see the install banner
3. Or check the address bar for install icon
4. Test on mobile devices

### Verify PWA Score:
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Analyze page load"
5. You should get 100% PWA score!

### Check in DevTools:
- **Application → Manifest**: Should show your app info
- **Application → Service Workers**: Should show active worker
- **Application → Cache Storage**: Should show cached files

## Environment Variables

Make sure to add your Firebase config in Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```

## Mobile Installation:

### iOS (Safari):
1. Open your deployed URL
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome):
1. Open your deployed URL
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home Screen"
4. Tap "Install"

### Desktop (Chrome/Edge):
1. Open your deployed URL
2. Click the install icon in address bar
3. Or the install banner will appear
4. Click "Install"

## Files Configured:

- ✅ `vercel.json` - Headers configuration
- ✅ `public/sw.js` - Service worker
- ✅ `public/manifest.json` - PWA manifest
- ✅ `components/PWAInstall.tsx` - Install prompt
- ✅ `app/layout.tsx` - PWA integration
- ✅ `next.config.ts` - Next.js config

## Troubleshooting:

### PWA not installable?
- Clear browser cache
- Check HTTPS (Vercel provides this)
- Verify manifest.json is accessible
- Check service worker registration in DevTools

### Install prompt not showing?
- May have dismissed it before
- Try in incognito/private mode
- Check if already installed
- Some browsers show icon in address bar instead

### Service worker not registering?
- Check browser console for errors
- Verify `/sw.js` is accessible
- Clear cache and hard reload
- Check Vercel deployment logs

## Success Indicators:

✅ App installs on desktop
✅ App installs on mobile
✅ Works offline (cached pages)
✅ Install banner appears
✅ Lighthouse PWA score 100%
✅ Appears in app drawer (mobile)
✅ Standalone window (no browser UI)

## Need Help?

- Check Vercel deployment logs
- Use Chrome DevTools → Application tab
- Test in different browsers
- Verify all icons are accessible

---

**Ready to deploy!** 🚀

Run: `vercel --prod`
