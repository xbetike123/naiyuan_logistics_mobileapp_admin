'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface NotificationCounts {
  packages: number;
  shipmentRequests: number;
  pendingPayments: number;
  processingShipments: number;
  total: number;
}

export function TopBar() {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const data = await api.getNotificationCounts();
      setCounts(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const totalBadge = counts?.total || 0;

  return (
    <div className="h-14 border-b border-surface-200 bg-white flex items-center justify-end px-6">
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <Bell size={20} className="text-surface-600" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && counts && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-lg border border-surface-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-100">
                <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
              </div>
              <div className="py-1">
                {counts.packages > 0 && (
                  <a href="/packages" className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors">
                    <span className="text-sm text-surface-700">📦 New packages arrived</span>
                    <span className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                      {counts.packages}
                    </span>
                  </a>
                )}
                {counts.shipmentRequests > 0 && (
                  <a href="/shipment-requests" className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors">
                    <span className="text-sm text-surface-700">📋 Pending shipment requests</span>
                    <span className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                      {counts.shipmentRequests}
                    </span>
                  </a>
                )}
                {counts.pendingPayments > 0 && (
                  <a href="/bills" className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors">
                    <span className="text-sm text-surface-700">💳 Pending bill payments</span>
                    <span className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                      {counts.pendingPayments}
                    </span>
                  </a>
                )}
                {totalBadge === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-surface-400">All caught up! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
