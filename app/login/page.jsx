'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Login failed.');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-signal" />
        <div className="pl-6">
          <p className="font-display text-2xl font-bold text-paper tracking-tight">MAFHH AVIATION</p>
        </div>
        <div className="pl-6">
          <p className="font-display text-4xl font-semibold text-paper leading-tight max-w-md">
            Operations, in one place.
          </p>
          <p className="text-slate-light text-sm mt-4 max-w-sm">
            Shipments, flights, attendance and monitoring — live, from a single dashboard.
          </p>
        </div>
        <div className="pl-6">
          <p className="text-xs text-slate-light">MAFHH Aviation Pvt Ltd · Lahore</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <p className="font-display text-xl font-bold text-ink">MAFHH AVIATION</p>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink mb-1">Sign in</h1>
          <p className="text-sm text-slate mb-8">Enter your credentials to open the dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
                placeholder="you@mafhhaviations.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-signal border-l-2 border-signal pl-3 py-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal text-paper py-2.5 text-sm font-medium hover:bg-signal-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
