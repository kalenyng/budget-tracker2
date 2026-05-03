import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Trim whitespace/newlines. Default `auto`: no path redirects — client `viewport-guard.js`
  // sends narrow viewports from desktop paths to /mobile-*.
  // Set PUBLIC_SITE_MODE=mobile for a mobile-only deploy (everything else -> mobile-dashboard).
  // Do not redirect /mobile-* away on "desktop": that used to 307 to / and caused an infinite
  // loop with viewport-guard (narrow / -> /mobile-dashboard -> 307 / -> ...).
  const raw = (import.meta.env.PUBLIC_SITE_MODE ?? 'auto').trim();
  const mode = raw === '' ? 'auto' : raw;
  const pathname = context.url.pathname;

  const isMobileRoute = pathname.startsWith('/mobile');
  const isAuthRoute = pathname.startsWith('/auth');

  // Allow auth routes to pass through
  if (isAuthRoute) return next();

  // Mobile deployment: redirect all non-mobile routes to mobile-dashboard
  if (mode === 'mobile') {
    if (!isMobileRoute) {
      // Special case: redirect /settings to /mobile-settings
      if (pathname === '/settings' || pathname === '/settings/') {
        return context.redirect('/mobile-settings', 307);
      }
      return context.redirect('/mobile-dashboard', 307);
    }
  }

  return next();
});
