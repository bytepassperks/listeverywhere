'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md p-8 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
          Sign in to ListEverywhere
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-white" style={{ background: 'var(--destructive)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium" style={{ color: 'var(--primary)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
