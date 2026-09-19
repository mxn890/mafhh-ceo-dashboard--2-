import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Explicitly public — everything else requires a signed-in session.
// Shipments is public per the client's request (this is the module
// other people, like the airline side or ops team, may need to check
// without a login).
const PUBLIC_PATHS = ['/login', '/shipments'];
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/module123/'];

async function hasValidSession(request) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  const authed = await hasValidSession(request);
  if (authed) return NextResponse.next();

  // API routes get a 401, not a redirect — a fetch() call can't follow a
  // redirect to an HTML login page usefully.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico and other static files with an extension
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
