'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import {
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Truck,
  Package,
  Users,
  MapPin,
  Scale,
} from 'lucide-react';

interface MasterShipment {
  id: string;
  masterTrackingNo: string;
  status: string;
  method: string;
  route: string | null;
  destination: string | null;
  totalWeightKg: number | null;
  totalVolumeCBM: number | null;
  estimatedArrival: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  shipments: Array<{
    id: string;
    shipmentNumber: string;
    status: string;
    method: string;
    user: { id: string; email: string; firstName: string; lastName: string };
    packages: Array<{
      id: string;
      package: { id: string; trackingNumber: string; description: string | null; status: string };
    }>;
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    notes: string | null;
    location: string | null;
    timestamp: string;
  }>;
}

interface ApprovedShipment {
  id: string;
  shipmentNumber: string;
  method: string;
  user: { firstName: string; lastName: string; email: string };
  packages: any[];
}

const STATUSES = ['PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const ROUTES = ['GUANGZHOU', 'YIWU', 'SHENZHEN'];

export default function MasterShipmentsPage() {
  const [masterShipments, setMasterShipments] = useState<MasterShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState<MasterShipment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailShipment, setDetailShipment] = useState<any | null>(null);

  const fetchMasterShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMasterShipments();
      setMasterShipments(data);
    } catch (err) {
      console.error('Failed to fetch master shipments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMasterShipments(); }, [fetchMasterShipments]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Master Shipments</h1>
          <p className="text-surface-500 mt-1">
            {masterShipments.length} master shipment{masterShipments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchMasterShipments} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all">
            <Plus size={16} /> Create Master Shipment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : masterShipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center h-64 text-surface-400">
          <Truck size={40} className="mb-3" />
          <p className="text-lg font-medium">No master shipments</p>
          <p className="text-sm mt-1">Create one to group approved user shipments together</p>
        </div>
      ) : (
        <div className="space-y-4">
          {masterShipments.map((ms) => {
            const totalPackages = ms.shipments.reduce((sum, s) => sum + s.packages.length, 0);
            const isExpanded = expandedId === ms.id;

            return (
              <div key={ms.id} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : ms.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Truck size={22} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-surface-900">{ms.masterTrackingNo}</span>
                        <StatusBadge status={ms.status} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                          {ms.method === 'AIR' ? '✈️ Air' : '🚢 Sea'}
                        </span>
                        {ms.route && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                            📍 {ms.route}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-surface-500 flex items-center gap-1">
                          <Users size={12} /> {ms.shipments.length} shipment{ms.shipments.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-surface-500 flex items-center gap-1">
                          <Package size={12} /> {totalPackages} package{totalPackages !== 1 ? 's' : ''}
                        </span>
                        {ms.totalWeightKg && (
                          <span className="text-xs text-surface-500">⚖️ {ms.totalWeightKg} kg</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-surface-400">{formatDate(ms.createdAt)}</span>
                    {isExpanded ? <ChevronUp size={18} className="text-surface-400" /> : <ChevronDown size={18} className="text-surface-400" />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-surface-100">
                    {/* Info Grid */}
                    <div className="px-5 py-4 bg-surface-50/50 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Destination</p>
                        <p className="text-sm text-surface-700">{ms.destination || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Est. Arrival</p>
                        <p className="text-sm text-surface-700">{ms.estimatedArrival ? formatDate(ms.estimatedArrival) : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Weight</p>
                        <p className="text-sm text-surface-700">{ms.totalWeightKg ? `${ms.totalWeightKg} kg` : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Volume</p>
                        <p className="text-sm text-surface-700">{ms.totalVolumeCBM ? `${ms.totalVolumeCBM} CBM` : 'Not set'}</p>
                      </div>
                    </div>

                    {/* Linked Shipments */}
                    <div className="px-5 py-4">
                      <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">Linked Shipments ({ms.shipments.length})</p>
                      <div className="space-y-2">
                        {ms.shipments.map((s: any) => (
                          <div key={s.id} className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-surface-900">{s.shipmentNumber}</span>
                                <StatusBadge status={s.status} />
                              </div>
                              <span className="text-sm text-surface-600">{s.user.firstName} {s.user.lastName}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {s.packages.map((p: any) => (
                                <span key={p.id} className="text-xs font-mono px-2 py-1 rounded-lg bg-white border border-surface-200 text-surface-600">
                                  {p.package.trackingNumber}
                                </span>
                              ))}
                            </div>
                            {s.weightKg ? (
                              <div className="flex items-center gap-4 text-xs text-surface-500 bg-white p-3 rounded-lg border border-surface-100">
                                <span>⚖️ {s.weightKg} kg</span>
                                {s.volumeCBM && <span>📦 {s.volumeCBM} CBM</span>}
                                <span>💰 ₦{Number(s.shippingFeeNGN || 0).toLocaleString()}</span>
                                <span>📋 Bill generated</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDetailShipment(s); }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-400 text-surface-950 text-xs font-medium hover:bg-brand-500 transition-all"
                              >
                                <Scale size={14} /> Add Details & Generate Bill
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status History */}
                    {ms.statusHistory.length > 0 && (
                      <div className="px-5 py-4 border-t border-surface-100">
                        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">Status History</p>
                        <div className="space-y-2">
                          {ms.statusHistory.map((h) => (
                            <div key={h.id} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-surface-300 mt-1.5 flex-shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={h.status} />
                                  <span className="text-xs text-surface-400">{formatDate(h.timestamp)}</span>
                                </div>
                                {h.location && <p className="text-xs text-surface-500 mt-0.5">📍 {h.location}</p>}
                                {h.notes && <p className="text-xs text-surface-500 mt-0.5">{h.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-5 py-4 border-t border-surface-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowStatusUpdate(ms); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all"
                      >
                        <MapPin size={16} /> Update Status
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateMasterShipmentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchMasterShipments(); }}
        />
      )}

      {/* Add Details & Generate Bill Modal */}
      {detailShipment && (
        <AddDetailsModal
          shipment={detailShipment}
          onClose={() => setDetailShipment(null)}
          onSaved={() => { setDetailShipment(null); fetchMasterShipments(); }}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <UpdateMasterStatusModal
          masterShipment={showStatusUpdate}
          onClose={() => setShowStatusUpdate(null)}
          onUpdated={() => { setShowStatusUpdate(null); fetchMasterShipments(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CREATE MASTER SHIPMENT MODAL
// ════════════════════════════════════════════════════════════════════

function CreateMasterShipmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [method, setMethod] = useState('AIR');
  const [route, setRoute] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvedShipments, setApprovedShipments] = useState<ApprovedShipment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fetchingShipments, setFetchingShipments] = useState(true);

  useEffect(() => {
    api.getShipments('PROCESSING').then((data) => {
      // Only show shipments not yet assigned to a master shipment
      const unassigned = data.filter((s: any) => !s.masterShipmentId);
      setApprovedShipments(unassigned);
    }).finally(() => setFetchingShipments(false));
  }, []);

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      alert('Select at least one shipment');
      return;
    }
    setLoading(true);
    try {
      await api.createMasterShipment({
        method,
        route: route || undefined,
        destination: destination || undefined,
        estimatedArrival: estimatedArrival || undefined,
        shipmentIds: Array.from(selectedIds),
      });
      onCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Create Master Shipment</h3>
            <p className="text-sm text-surface-500 mt-0.5">Group approved shipments into one master shipment</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* Method & Route */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Shipping Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
                <option value="AIR">✈️ Air Freight</option>
                <option value="SEA">🚢 Sea Freight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Route</label>
              <select value={route} onChange={(e) => setRoute(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
                <option value="">Select route</option>
                {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Destination & ETA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Destination</label>
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Lagos, Nigeria" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Estimated Arrival</label>
              <input type="date" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>

          {/* Select Shipments */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Select Shipments ({selectedIds.size} selected)
            </label>
            {fetchingShipments ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : approvedShipments.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 text-center">
                <p className="text-sm text-surface-500">No approved shipments available</p>
                <p className="text-xs text-surface-400 mt-1">Approve shipment requests first</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {approvedShipments.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedIds.has(s.id)
                        ? 'border-brand-400 bg-brand-50/50'
                        : 'border-surface-100 bg-surface-50 hover:border-surface-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="rounded border-surface-300 text-brand-500 focus:ring-brand-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-surface-900">{s.shipmentNumber}</span>
                        <span className="text-xs text-surface-500">{s.method === 'AIR' ? '✈️' : '🚢'}</span>
                      </div>
                      <p className="text-xs text-surface-500">{s.user.firstName} {s.user.lastName} · {s.packages.length} packages</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || selectedIds.size === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : `Create Master Shipment (${selectedIds.size} shipments)`}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// UPDATE MASTER STATUS MODAL
// ════════════════════════════════════════════════════════════════════

function UpdateMasterStatusModal({ masterShipment, onClose, onUpdated }: { masterShipment: MasterShipment; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(masterShipment.status);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateMasterShipmentStatus(masterShipment.id, {
        status,
        notes: notes || undefined,
        location: location || undefined,
      });
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Update Master Shipment</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">{masterShipment.masterTrackingNo}</p>
            <p className="text-xs text-surface-400 mt-1">This will update all {masterShipment.shipments.length} linked shipments</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">New Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Guangzhou Port, Lagos Customs" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Status update notes..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Updating...' : 'Update All Shipments'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════
// ADD DETAILS & GENERATE BILL MODAL
// ════════════════════════════════════════════════════════════════════

function AddDetailsModal({ shipment, onClose, onSaved }: { shipment: any; onClose: () => void; onSaved: () => void }) {
  const [weightKg, setWeightKg] = useState('');
  const [volumeCBM, setVolumeCBM] = useState('');
  const [billingMethod, setBillingMethod] = useState<'WEIGHT' | 'VOLUME'>('WEIGHT');
  const [packingFee, setPackingFee] = useState('');
  const [additionalFees, setAdditionalFees] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isSea = shipment.method === 'SEA';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg) {
      alert('Weight is required');
      return;
    }
    if (billingMethod === 'VOLUME' && !volumeCBM) {
      alert('Volume (CBM) is required for volume-based billing');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addShipmentDetailsAndGenerateBill(shipment.id, {
        weightKg: parseFloat(weightKg),
        volumeCBM: volumeCBM ? parseFloat(volumeCBM) : undefined,
        billingMethod,
        packingFee: packingFee ? parseFloat(packingFee) : undefined,
        additionalFees: additionalFees ? parseFloat(additionalFees) : undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Add Details & Generate Bill</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">{shipment.shipmentNumber}</p>
            <p className="text-xs text-surface-400 mt-1">
              {shipment.user.firstName} {shipment.user.lastName} · {shipment.method === 'AIR' ? '✈️ Air' : '🚢 Sea'} · {shipment.packages.length} packages
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>

        {result ? (
          // Success view
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Scale size={28} className="text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-surface-900">Bill Generated!</h4>
              <p className="text-sm text-surface-500 mt-1">{result.bill.billNumber}</p>
            </div>

            <div className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-100">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Billing Method</span>
                <span className="font-medium text-surface-900">{result.shipment.billingMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Weight</span>
                <span className="font-medium text-surface-900">{result.shipment.weightKg} kg</span>
              </div>
              {result.shipment.volumeCBM && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Volume</span>
                  <span className="font-medium text-surface-900">{result.shipment.volumeCBM} CBM</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Rate</span>
                <span className="font-medium text-surface-900">
                  {result.shipment.billingMethod === 'VOLUME'
                    ? `₦${Number(result.rate.ratePerCBM).toLocaleString()}/CBM`
                    : `₦${Number(result.rate.ratePerKg).toLocaleString()}/kg`
                  }
                </span>
              </div>
              <hr className="border-surface-200" />
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Shipping Fee</span>
                <span className="font-medium text-surface-900">₦{Number(result.shipment.shippingFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Packing Fee</span>
                <span className="font-medium text-surface-900">₦{Number(result.shipment.packingFee).toLocaleString()}</span>
              </div>
              {result.shipment.additionalFees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Additional Fees</span>
                  <span className="font-medium text-surface-900">₦{Number(result.shipment.additionalFees).toLocaleString()}</span>
                </div>
              )}
              <hr className="border-surface-200" />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-surface-900">Total</span>
                <span className="font-bold text-lg text-surface-900">₦{Number(result.shipment.totalAmount).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onSaved}
              className="w-full mt-4 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          // Form view
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Billing Method (Sea freight only) */}
            {isSea && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Billing Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingMethod('VOLUME')}
                    className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${
                      billingMethod === 'VOLUME'
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-surface-200 bg-surface-50 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    📦 By Volume (CBM)
                    <p className="text-xs mt-0.5 font-normal">Nigeria destination</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMethod('WEIGHT')}
                    className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${
                      billingMethod === 'WEIGHT'
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-surface-200 bg-surface-50 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    ⚖️ By Weight (kg)
                    <p className="text-xs mt-0.5 font-normal">UK, USA, Italy, etc.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 25.5"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Volume (show for sea or if volume billing selected) */}
            {(isSea || billingMethod === 'VOLUME') && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Volume (CBM) {billingMethod === 'VOLUME' ? '*' : ''}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={volumeCBM}
                  onChange={(e) => setVolumeCBM(e.target.value)}
                  placeholder="e.g. 1.5"
                  required={billingMethod === 'VOLUME'}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            )}

            {/* Packing Fee */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Packing Fee (₦)</label>
              <input
                type="number"
                value={packingFee}
                onChange={(e) => setPackingFee(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Additional Fees */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Additional Fees (₦)</label>
              <input
                type="number"
                value={additionalFees}
                onChange={(e) => setAdditionalFees(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Generating Bill...' : 'Calculate & Generate Bill'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
