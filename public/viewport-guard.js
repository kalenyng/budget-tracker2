/**
 * Routes by viewport width (max-width 767px = mobile shell).
 * Narrow viewports on desktop paths are sent to the matching /mobile-* route.
 * Wide viewports are never redirected off /mobile-* so bookmarks and direct
 * links to the mobile dashboard always work.
 *
 * Use PUBLIC_SITE_MODE=auto (or unset) in production so middleware does not override paths.
 */
(function () {
  var MAX_MOBILE_PX = 767;

  function isNarrow() {
    return window.matchMedia('(max-width: ' + MAX_MOBILE_PX + 'px)').matches;
  }

  function normalizePath(pathname) {
    var p = pathname || '/';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    return p || '/';
  }

  function isMobilePath(p) {
    return p.indexOf('/mobile') === 0;
  }

  function mobileTargetForDesktopPath(p) {
    if (p === '/settings') return '/mobile-settings';
    return '/mobile-dashboard';
  }

  function run() {
    var p = normalizePath(window.location.pathname);
    if (p === '/auth') return;

    var narrow = isNarrow();
    var q = window.location.search || '';

    if (narrow && !isMobilePath(p)) {
      var m = mobileTargetForDesktopPath(p);
      if (normalizePath(window.location.pathname) !== normalizePath(m)) {
        window.location.replace(m + q);
      }
    }
  }

  run();

  var mq = window.matchMedia('(max-width: ' + MAX_MOBILE_PX + 'px)');
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', run);
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(run);
  }
})();
