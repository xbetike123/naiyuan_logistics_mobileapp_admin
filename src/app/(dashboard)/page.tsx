'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Package, Truck, Receipt, Users, Clock, AlertTriangle } from 'lucide-react';

interface DashboardData {
  totalUsers: number;
  totalPackages: number;
  packagesByStatus: Array<{ status: string; _count: { status: number } }>;
  totalShipments: number;
  pendingShipments: number;
  totalRevenue: number;
  pendingPayments: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-surface-500">Failed to load dashboard</p>;

  const stats = [
    {
      label: 'Total Packages',
      value: data.totalPackages,
      icon: Package,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      label: 'Total Shipments',
      value: data.totalShipments,
      icon: Truck,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: Receipt,
      color: 'bg-brand-500',
      lightColor: 'bg-brand-50',
    },
    {
      label: 'Total Users',
      value: data.totalUsers,
      icon: Users,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
    },
    {
      label: 'Pending Shipments',
      value: data.pendingShipments,
      icon: Clock,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
    },
    {
      label: 'Pending Payments',
      value: data.pendingPayments,
      icon: AlertTriangle,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your logistics operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-surface-200/60 p-6 hover:shadow-lg hover:shadow-surface-200/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500">{stat.label}</p>
                <p className="text-3xl font-bold text-surface-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.lightColor} p-3 rounded-xl`}>
                <stat.icon size={22} className={stat.color.replace('bg-', 'text-')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Package Status Breakdown */}
      <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Packages by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.packagesByStatus.map((item) => (
            <div key={item.status} className="text-center p-4 rounded-xl bg-surface-50">
              <p className="text-2xl font-bold text-surface-900">{item._count.status}</p>
              <p className="text-sm text-surface-500 mt-1">{item.status.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}