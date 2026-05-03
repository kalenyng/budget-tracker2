/**
 * Routes by viewport width (max-width 767px = mobile shell).
 * Use PUBLIC_SITE_MODE=auto (or unset) in production so middleware does not override paths.
 *
 * Wide viewports normally leave /mobile-* for the desktop app. To stay on the mobile shell
 * (e.g. testing on a laptop), open once with ?mobile=1 or append it to the URL; preference
 * is stored in sessionStorage until you use ?mobile=0 on a mobile route.
 */
(function () {
  var MAX_MOBILE_PX = 767;
  var MOBILE_SHELL_STORAGE_KEY = 'budgetAppMobileShell';

  function prefersMobileShellOnWideViewport() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var flag = params.get('mobile');
      if (flag === '1') {
        sessionStorage.setItem(MOBILE_SHELL_STORAGE_KEY, '1');
        params.delete('mobile');
        var qs = params.toString();
        var next = window.location.pathname + (qs ? '?' + qs : '') + (window.location.hash || '');
        var cur = window.location.pathname + window.location.search + (window.location.hash || '');
        if (next !== cur) {
          window.history.replaceState(null, '', next);
        }
        return true;
      }
      if (flag === '0') {
        sessionStorage.removeItem(MOBILE_SHELL_STORAGE_KEY);
        return false;
      }
    } catch (e) {}
    try {
      return sessionStorage.getItem(MOBILE_SHELL_STORAGE_KEY) === '1';
    } catch (e2) {
      return false;
    }
  }

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

  function desktopTargetForMobilePath(p) {
    if (p === '/mobile-settings') return '/settings';
    if (p === '/mobile-sort') return '/transactions';
    return '/';
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
      return;
    }

    if (!narrow && isMobilePath(p)) {
      if (prefersMobileShellOnWideViewport()) return;
      var d = desktopTargetForMobilePath(p);
      if (normalizePath(window.location.pathname) !== normalizePath(d)) {
        window.location.replace(d + q);
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
