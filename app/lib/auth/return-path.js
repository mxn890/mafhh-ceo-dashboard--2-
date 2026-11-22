// Accept internal pages only; never turn a login return URL into an external redirect.
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://dashboard.invalid');
    if (url.origin !== 'https://dashboard.invalid' || url.pathname.startsWith('//') || /^\/(?:login|api)(?:\/|$)/.test(url.pathname)) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}

export function dashboardLoginPath(returnPath) {
  return '/login?' + new URLSearchParams({ next: safeReturnPath(returnPath) });
}
