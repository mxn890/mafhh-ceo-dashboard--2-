import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export async function createToken(userId, email, role) {
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRE)
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token) {
  const session = await verifyToken(token);
  if (!session || !Number.isFinite(session.exp)) throw new Error('Invalid session cookie.');
  const remaining = Math.max(0, Math.floor(session.exp - Date.now() / 1000));
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.min(7 * 24 * 60 * 60, remaining), // Never extend the signed session.
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}


export async function restoreAuthCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token || !(await verifyToken(token))) return false;
    await setAuthCookie(token);
    return true;
  } catch { return false; }
}
