'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { RefreshCw, Inbox, Check, X, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface ShipmentRequest {
  id: string;
  shipmentNumber: string;
  status: string;
  method: string;
  deliveryAddress: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
  packages: Array<{
    id: string;
    packageId: string;
    package: { id: string; trackingNumber: string; description: string | null; status: string };
  }>;
}

export default function ShipmentRequestsPage() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShipmentRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.approveShipmentRequest(id);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      await api.rejectShipmentRequest(id, rejectReason || undefined);
      setRejectingId(null);
      setRejectReason('');
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Shipment Requests</h1>
          <p className="text-surface-500 mt-1">
            {requests.length} pending request{requests.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center h-64 text-surface-400">
          <Inbox size={40} className="mb-3" />
          <p className="text-lg font-medium">No pending requests</p>
          <p className="text-sm mt-1">All shipment requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Package size={22} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-surface-900">{req.shipmentNumber}</span>
                      <StatusBadge status={req.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                        {req.method === 'AIR' ? '✈️ Air' : '🚢 Sea'}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {req.user.firstName} {req.user.lastName} · {req.user.email} · {req.packages.length} package{req.packages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-400">{formatDate(req.createdAt)}</span>
                  {expandedId === req.id ? <ChevronUp size={18} className="text-surface-400" /> : <ChevronDown size={18} className="text-surface-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === req.id && (
                <div className="border-t border-surface-100">
                  {/* Customer Info */}
                  <div className="px-5 py-4 bg-surface-50/50">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Customer</p>
                        <p className="text-sm font-medium text-surface-900">{req.user.firstName} {req.user.lastName}</p>
                        <p className="text-xs text-surface-500">{req.user.email}</p>
                        {req.user.phone && <p className="text-xs text-surface-500">{req.user.phone}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Delivery Address</p>
                        <p className="text-sm text-surface-700">{req.deliveryAddress || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Requested</p>
                        <p className="text-sm text-surface-700">{formatDate(req.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Packages */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">Packages ({req.packages.length})</p>
                    <div className="space-y-2">
                      {req.packages.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-100">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Package size={14} className="text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <span className="font-mono text-sm font-medium text-surface-900">{p.package.trackingNumber}</span>
                            {p.package.description && (
                              <p className="text-xs text-surface-500">{p.package.description}</p>
                            )}
                          </div>
                          <StatusBadge status={p.package.status} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-t border-surface-100 flex items-center gap-3">
                    {rejectingId === req.id ? (
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
                          {actionLoading === req.id ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          <Check size={16} />
                          {actionLoading === req.id ? 'Approving...' : 'Approve Request'}
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-all"
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}