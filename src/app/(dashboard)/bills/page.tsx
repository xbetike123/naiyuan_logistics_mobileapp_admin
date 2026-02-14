'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Search, RefreshCw, ChevronDown, Receipt } from 'lucide-react';

interface BillItem {
  id: string;
  billNumber: string;
  status: string;
  shippingFee: number;
  clearingFee: number;
  additionalFees: number;
  totalAmount: number;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  shipment: { id: string; shipmentNumber: string; method: string } | null;
}

const STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBills(filterStatus || undefined, search || undefined);
      setBills(data);
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Bills</h1>
          <p className="text-surface-500 mt-1">{bills.length} bills</p>
        </div>
        <button onClick={fetchBills} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search bill number, email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <Receipt size={32} className="mb-2" />
            <p className="text-sm">No bills found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Bill #</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Shipment</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Amount</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4"><span className="font-mono text-sm font-medium text-surface-900">{bill.billNumber}</span></td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-surface-900">{bill.user.firstName} {bill.user.lastName}</p>
                    <p className="text-xs text-surface-500">{bill.user.email}</p>
                  </td>
                  <td className="p-4">
                    {bill.shipment ? (
                      <span className="font-mono text-sm text-surface-600">{bill.shipment.shipmentNumber}</span>
                    ) : <span className="text-surface-400">—</span>}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-surface-900">{formatCurrency(bill.totalAmount)}</p>
                    <p className="text-xs text-surface-500">
                      Ship: {formatCurrency(bill.shippingFee)} · Clear: {formatCurrency(bill.clearingFee)}
                    </p>
                  </td>
                  <td className="p-4"><StatusBadge status={bill.status} /></td>
                  <td className="p-4 text-sm text-surface-500">{formatDate(bill.dueDate)}</td>
                  <td className="p-4 text-sm text-surface-500">{formatDate(bill.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}