'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Truck,
  Receipt,
  PackageCheck,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Inbox,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Packages', href: '/packages', icon: Package },
  { label: 'Shipment Requests', href: '/shipment-requests', icon: Inbox },
  { label: 'Master Shipments', href: '/master-shipments', icon: Truck },
  { label: 'Bills', href: '/bills', icon: Receipt, badgeKey: 'pendingPayments' },
  { label: 'Pickups', href: '/pickups', icon: PackageCheck },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);

  // Poll for pending payments every 30 seconds
  const fetchPendingCount = useCallback(async () => {
    try {
      const data = await api.getPendingPayments();
      setPendingPayments(Array.isArray(data) ? data.length : 0);
    } catch {
      // Silently fail — sidebar shouldn't break if this fails
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  // Also refresh when navigating to bills page
  useEffect(() => {
    if (pathname === '/bills') {
      fetchPendingCount();
    }
  }, [pathname, fetchPendingCount]);

  function getBadgeCount(badgeKey?: string) {
    if (badgeKey === 'pendingPayments') return pendingPayments;
    return 0;
  }

  function handleLogout() {
    api.clearToken();
    window.location.href = '/login';
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-surface-950 border-r border-surface-800 flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-surface-800/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center flex-shrink-0">
            <span className="text-surface-950 font-bold text-sm">N</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight truncate">
              Naiyuan
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto text-surface-400 hover:text-white transition-colors flex-shrink-0',
            collapsed && 'mx-auto ml-0 mt-0'
          )}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const badgeCount = getBadgeCount(item.badgeKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-400/10 text-brand-400'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <item.icon size={20} />
                {/* Badge dot on icon when collapsed */}
                {collapsed && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-surface-950 animate-pulse" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {/* Badge count when expanded */}
                  {badgeCount > 0 && (
                    <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-800/50">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
