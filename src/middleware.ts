import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Trim whitespace/newlines. Default `auto`: no path redirects — client `viewport-guard.js`
  // picks mobile vs desktop by viewport; keep `auto` (or unset) for that behavior.
  // Set PUBLIC_SITE_MODE=mobile | desktop only for fixed mobile-only / desktop-only deploys.
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

  // Desktop deployment: all /mobile-* routes (including /mobile-sort) redirect to home.
  // Never send desktop traffic to mobile-only surfaces.
  if (mode === 'desktop') {
    if (isMobileRoute) {
      return context.redirect('/', 307);
    }
  }

  return next();
});
