# PWA Configuration for Vercel

This app is configured as a Progressive Web App (PWA) and will work on Vercel with full functionality.

## What's Configured:

1. **Service Worker** (`public/sw.js`)
   - Caches app shell for offline access
   - Handles network requests intelligently
   - Works with Vercel's CDN

2. **Manifest** (`public/manifest.json`)
   - App metadata for installation
   - Icons for different platforms
   - Display and theme settings

3. **Vercel Headers** (`vercel.json`)
   - Proper Content-Type for service worker
   - Cache control headers
   - Security headers

4. **PWA Install Component** (`components/PWAInstall.tsx`)
   - Automatic install prompt
   - Works on all browsers
   - Handles installation state

## Testing on Vercel:

1. Deploy to Vercel: `vercel --prod`
2. Open your deployed URL
3. The install banner should appear automatically
4. Test installation on different devices

## Browser Support:

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS - use "Add to Home Screen")
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet

## Lighthouse PWA Score:

Run Lighthouse audit on your deployed URL to verify:
- Installable
- Works offline
- Fast and reliable
- Optimized

## Notes:

- PWA install works best on HTTPS (Vercel provides this automatically)
- Service worker is disabled in development mode for easier debugging
- Clear cache if you make changes to the service worker
