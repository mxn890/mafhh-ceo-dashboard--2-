import { NextResponse } from 'next/server';
import { restoreAuthCookie } from '@/app/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Same-origin browser fetch sends an existing Strict cookie too. Re-issue it
  // as Lax without extending the signed token's original expiry.
  return NextResponse.json({ authenticated: await restoreAuthCookie() }, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
}
