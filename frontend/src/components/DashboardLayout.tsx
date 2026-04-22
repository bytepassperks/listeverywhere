'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/submissions', label: 'Submissions', icon: '📤' },
  { href: '/dashboard/directories', label: 'Directories', icon: '📂' },
  { href: '/dashboard/indexer', label: 'Indexer', icon: '🔍' },
  { href: '/dashboard/bulk', label: 'Bulk Upload', icon: '📦' },
  { href: '/dashboard/demo-video', label: 'Demo Video', icon: '🎬' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    api.getMe().then(data => {
      setUserInfo({ email: data.user.email, role: data.user.role });
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    await api.logout();
    router.push('/login');
  }

  const isSuperAdmin = userInfo?.role === 'super_admin';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <aside className="w-64 border-r flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/dashboard" className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            List<span style={{ color: 'var(--primary)' }}>Everywhere</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {userInfo && (
            <div className="mb-3 px-3">
              <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                {userInfo.email}
              </div>
              {isSuperAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  Super Admin
                </span>
              )}
              {!isSuperAdmin && userInfo.role !== 'user' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
                  {userInfo.role}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
