import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const mode = import.meta.env.PUBLIC_SITE_MODE ?? 'desktop';
  const pathname = context.url.pathname;

  const isMobileRoute = pathname.startsWith('/mobile');
  const isAuthRoute = pathname.startsWith('/auth');

  // Allow auth routes to pass through
  if (isAuthRoute) return next();

  // Mobile deployment: redirect all non-mobile routes to mobile-dashboard
  if (mode === 'mobile') {
    if (!isMobileRoute) {
      return context.redirect('/mobile-dashboard', 307);
    }
  }

  // Desktop deployment: redirect mobile routes to home
  if (mode === 'desktop') {
    if (isMobileRoute) {
      return context.redirect('/', 307);
    }
  }

  return next();
});
