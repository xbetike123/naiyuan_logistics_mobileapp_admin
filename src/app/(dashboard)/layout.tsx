// src/app/(dashboard)/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = api.getToken();

      // No token at all — go to login
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setReady(true);
            return;
          }
        }

        // Token invalid or expired
        api.clearToken();
        router.replace('/login');
      } catch (err) {
        if (cancelled) return;

        // Network error — check if token looks like a JWT (3 parts)
        // If it does, allow through (offline tolerance)
        // If it's an old base64 token, clear it
        if (token.split('.').length === 3) {
          setReady(true);
        } else {
          // Old-format token, clear it
          api.clearToken();
          router.replace('/login');
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="ml-[260px] min-h-screen">
        <TopBar />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
