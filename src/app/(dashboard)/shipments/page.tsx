'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { Search, RefreshCw, ChevronDown, X, Truck } from 'lucide-react';

interface ShipmentItem {
  id: string;
  shipmentNumber: string;
  status: string;
  method: string;
  route: string | null;
  weightKg: number | null;
  volumeCBM: number | null;
  totalCostNGN: number | null;
  deliveryAddress: string | null;
  createdAt: string;
  estimatedArrival: string | null;
  user: { id: string; email: string; firstName: string; lastName: string };
  packages: any[];
}

const STATUSES = ['REQUESTED', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingShipment, setEditingShipment] = useState<ShipmentItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShipments(filterStatus || undefined, search || undefined);
      setShipments(data);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleUpdateStatus(id: string, data: { status: string; notes?: string; location?: string }) {
    setActionLoading(true);
    try {
      await api.updateShipmentStatus(id, data);
      setEditingShipment(null);
      await fetchShipments();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Shipments</h1>
          <p className="text-surface-500 mt-1">{shipments.length} shipments</p>
        </div>
        <button onClick={fetchShipments} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search shipment number, email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent" />
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
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <Truck size={32} className="mb-2" />
            <p className="text-sm">No shipments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Shipment #</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Method</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Packages</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4"><span className="font-mono text-sm font-medium text-surface-900">{s.shipmentNumber}</span></td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-surface-900">{s.user.firstName} {s.user.lastName}</p>
                    <p className="text-xs text-surface-500">{s.user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{s.method === 'AIR' ? '✈️' : '🚢'} {s.method}</span>
                  </td>
                  <td className="p-4 text-sm text-surface-600">{s.packages.length}</td>
                  <td className="p-4"><StatusBadge status={s.status} /></td>
                  <td className="p-4 text-sm text-surface-500">{formatDate(s.createdAt)}</td>
                  <td className="p-4">
                    <button onClick={() => setEditingShipment(s)} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingShipment && (
        <UpdateStatusModal shipment={editingShipment} onClose={() => setEditingShipment(null)} onSave={handleUpdateStatus} loading={actionLoading} />
      )}
    </div>
  );
}

function UpdateStatusModal({ shipment, onClose, onSave, loading }: { shipment: ShipmentItem; onClose: () => void; onSave: (id: string, data: any) => void; loading: boolean }) {
  const [status, setStatus] = useState(shipment.status);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Update Shipment Status</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">{shipment.shipmentNumber}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(shipment.id, { status, notes: notes || undefined, location: location || undefined }); }} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">New Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Guangzhou Warehouse" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}