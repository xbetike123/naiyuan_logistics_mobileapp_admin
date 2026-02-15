'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import {
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Truck,
  Package,
  Users,
  MapPin,
  Scale,
  Clock,
  ArrowRight,
  Circle,
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
    weightKg?: number;
    volumeCBM?: number;
    shippingFeeNGN?: number;
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    trackingCode: string | null;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [detailShipment, setDetailShipment] = useState<any | null>(null);

  const selectedMs = masterShipments.find((ms) => ms.id === selectedId) || null;

  const fetchMasterShipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMasterShipments();
      setMasterShipments(data);
      // Auto-select first if none selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch master shipments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterShipments();
  }, [fetchMasterShipments]);

  function toggleShipmentExpand(msId: string) {
    const next = new Set(expandedShipments);
    if (next.has(msId)) next.delete(msId);
    else next.add(msId);
    setExpandedShipments(next);
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Master Shipments</h1>
          <p className="text-surface-500 mt-1">
            {masterShipments.length} master shipment{masterShipments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMasterShipments}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all"
          >
            <Plus size={16} /> Create Master Shipment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : masterShipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center h-64 text-surface-400">
          <Truck size={40} className="mb-3" />
          <p className="text-lg font-medium">No master shipments</p>
          <p className="text-sm mt-1">Create one to group approved user shipments together</p>
        </div>
      ) : (
        /* ═══════════ MASTER-DETAIL SPLIT LAYOUT ═══════════ */
        <div className="flex gap-6 items-start" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {/* ──────────── LEFT PANEL: Shipment List ──────────── */}
          <div className="w-[420px] flex-shrink-0 space-y-3">
            {masterShipments.map((ms) => {
              const totalPackages = ms.shipments.reduce((sum, s) => sum + s.packages.length, 0);
              const isSelected = selectedId === ms.id;
              const isShipmentsExpanded = expandedShipments.has(ms.id);

              return (
                <div
                  key={ms.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                    isSelected
                      ? 'border-brand-400 ring-1 ring-brand-400/20 shadow-sm'
                      : 'border-surface-200/60 hover:border-surface-300'
                  }`}
                >
                  {/* Card Header — click to select */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setSelectedId(ms.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-brand-50' : 'bg-indigo-50'
                          }`}
                        >
                          <Truck size={18} className={isSelected ? 'text-brand-500' : 'text-indigo-500'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-surface-900">
                              {ms.masterTrackingNo}
                            </span>
                            <StatusBadge status={ms.status} />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                              {ms.method === 'AIR' ? '✈️ Air' : '🚢 Sea'}
                            </span>
                            {ms.route && (
                              <span className="text-xs text-surface-400">📍 {ms.route}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-surface-400 mt-1">{formatDate(ms.createdAt)}</span>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 mt-3 ml-[52px]">
                      <span className="text-xs text-surface-500 flex items-center gap-1">
                        <Users size={11} /> {ms.shipments.length}
                      </span>
                      <span className="text-xs text-surface-500 flex items-center gap-1">
                        <Package size={11} /> {totalPackages}
                      </span>
                      {ms.totalWeightKg && (
                        <span className="text-xs text-surface-500">⚖️ {ms.totalWeightKg}kg</span>
                      )}
                      {ms.destination && (
                        <span className="text-xs text-surface-500">
                          → {ms.destination.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Linked Shipments Dropdown Toggle */}
                  <div className="border-t border-surface-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShipmentExpand(ms.id);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-surface-500 hover:bg-surface-50/80 transition-colors"
                    >
                      <span>Linked Shipments ({ms.shipments.length})</span>
                      {isShipmentsExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>

                    {/* Expanded Shipments */}
                    {isShipmentsExpanded && (
                      <div className="px-4 pb-3 space-y-2">
                        {ms.shipments.map((s: any) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-xl bg-surface-50 border border-surface-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-medium text-surface-900">
                                  {s.shipmentNumber}
                                </span>
                                <StatusBadge status={s.status} />
                              </div>
                              <span className="text-xs text-surface-500">
                                {s.user.firstName} {s.user.lastName}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {s.packages.map((p: any) => (
                                <span
                                  key={p.id}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-surface-200 text-surface-500"
                                >
                                  {p.package.trackingNumber}
                                </span>
                              ))}
                            </div>
                            {s.weightKg ? (
                              <div className="flex items-center gap-3 text-[11px] text-surface-500">
                                <span>⚖️ {s.weightKg}kg</span>
                                {s.volumeCBM && <span>📦 {s.volumeCBM} CBM</span>}
                                <span>💰 ₦{Number(s.shippingFeeNGN || 0).toLocaleString()}</span>
                                <span className="text-emerald-600">✓ Billed</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailShipment(s);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-400 text-surface-950 text-xs font-medium hover:bg-brand-500 transition-all"
                              >
                                <Scale size={12} /> Add Details & Bill
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ──────────── RIGHT PANEL: Detail / Timeline ──────────── */}
          <div className="flex-1 min-w-0 sticky top-6">
            {selectedMs ? (
              <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
                {/* Detail Header */}
                <div className="p-5 border-b border-surface-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-lg font-bold text-surface-900">
                          {selectedMs.masterTrackingNo}
                        </span>
                        <StatusBadge status={selectedMs.status} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-surface-500">
                        <span>{selectedMs.method === 'AIR' ? '✈️ Air Freight' : '🚢 Sea Freight'}</span>
                        {selectedMs.route && <span>📍 {selectedMs.route}</span>}
                        {selectedMs.destination && (
                          <>
                            <ArrowRight size={14} className="text-surface-300" />
                            <span>{selectedMs.destination.replace(/_/g, ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowStatusUpdate(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all"
                    >
                      <MapPin size={16} /> Update Status
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-surface-100">
                    <div>
                      <p className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                        Shipments
                      </p>
                      <p className="text-sm font-semibold text-surface-800 mt-0.5">
                        {selectedMs.shipments.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                        Est. Arrival
                      </p>
                      <p className="text-sm font-semibold text-surface-800 mt-0.5">
                        {selectedMs.estimatedArrival ? formatDate(selectedMs.estimatedArrival) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                        Weight
                      </p>
                      <p className="text-sm font-semibold text-surface-800 mt-0.5">
                        {selectedMs.totalWeightKg ? `${selectedMs.totalWeightKg} kg` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
                        Volume
                      </p>
                      <p className="text-sm font-semibold text-surface-800 mt-0.5">
                        {selectedMs.totalVolumeCBM ? `${selectedMs.totalVolumeCBM} CBM` : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                      <Clock size={15} /> Live Tracking Timeline
                    </h3>
                    <span className="text-xs text-surface-400">
                      {selectedMs.statusHistory.length} update{selectedMs.statusHistory.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {selectedMs.statusHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-surface-400">
                      <Clock size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">No tracking updates yet</p>
                      <p className="text-xs mt-1">Click "Update Status" to add the first one</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-surface-100" />

                      <div className="space-y-0">
                        {selectedMs.statusHistory.map((h, idx) => {
                          const isLatest = idx === 0;
                          return (
                            <div key={h.id} className="relative flex items-start gap-4 py-3">
                              {/* Dot */}
                              <div className="relative z-10 flex-shrink-0">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    isLatest
                                      ? 'bg-brand-400 border-brand-400 shadow-sm shadow-brand-400/30'
                                      : 'bg-white border-surface-300'
                                  }`}
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 -mt-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <StatusBadge status={h.status} />
                                  <span className="text-xs text-surface-400">
                                    {formatDate(h.timestamp)}
                                  </span>
                                </div>
                                {h.location && (
                                  <p className="text-sm text-surface-600 mt-1 flex items-center gap-1">
                                    <MapPin size={12} className="text-surface-400 flex-shrink-0" />
                                    {h.location}
                                  </p>
                                )}
                                {h.notes && (
                                  <p className="text-sm text-surface-500 mt-0.5">{h.notes}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No selection state */
              <div className="bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center h-96 text-surface-400">
                <Truck size={36} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">Select a master shipment</p>
                <p className="text-xs mt-1">Click on a shipment to view tracking details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateMasterShipmentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchMasterShipments();
          }}
        />
      )}

      {/* Add Details & Generate Bill Modal */}
      {detailShipment && (
        <AddDetailsModal
          shipment={detailShipment}
          onClose={() => setDetailShipment(null)}
          onSaved={() => {
            setDetailShipment(null);
            fetchMasterShipments();
          }}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && selectedMs && (
        <UpdateMasterStatusModal
          masterShipment={selectedMs}
          onClose={() => setShowStatusUpdate(false)}
          onUpdated={() => {
            setShowStatusUpdate(false);
            fetchMasterShipments();
          }}
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
    api
      .getShipments('PROCESSING')
      .then((data) => {
        const unassigned = data.filter((s: any) => !s.masterShipmentId);
        setApprovedShipments(unassigned);
      })
      .finally(() => setFetchingShipments(false));
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
            <p className="text-sm text-surface-500 mt-0.5">
              Group approved shipments into one master shipment
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Shipping Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="AIR">✈️ Air Freight</option>
                <option value="SEA">🚢 Sea Freight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select route</option>
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Destination</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select destination</option>
                <option value="LAGOS_NIGERIA">🇳🇬 Lagos, Nigeria</option>
                <option value="ABUJA_NIGERIA">🇳🇬 Abuja, Nigeria</option>
                <option value="GHANA">🇬🇭 Ghana</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="USA">🇺🇸 United States</option>
                <option value="ITALY">🇮🇹 Italy</option>
                <option value="CANADA">🇨🇦 Canada</option>
                <option value="UAE">🇦🇪 UAE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Estimated Arrival
              </label>
              <input
                type="date"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

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
                        <span className="font-mono text-sm font-medium text-surface-900">
                          {s.shipmentNumber}
                        </span>
                        <span className="text-xs text-surface-500">
                          {s.method === 'AIR' ? '✈️' : '🚢'}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500">
                        {s.user.firstName} {s.user.lastName} · {s.packages.length} packages
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || selectedIds.size === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : `Create Master Shipment (${selectedIds.size} shipments)`}
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
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// UPDATE MASTER STATUS MODAL
// ════════════════════════════════════════════════════════════════════

function UpdateMasterStatusModal({
  masterShipment,
  onClose,
  onUpdated,
}: {
  masterShipment: MasterShipment;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [trackingStatus, setTrackingStatus] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const destination = masterShipment.destination || '';
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingStatuses, setTrackingStatuses] = useState<any[]>([]);
  const [trackingLocations, setTrackingLocations] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Get tracking codes already used in this master shipment's history
  const usedStatusCodes = new Set(
    masterShipment.statusHistory
      .map((h) => h.trackingCode)
      .filter(Boolean)
  );

  const filteredStatuses = trackingStatuses.filter(
    (s) =>
      (s.destination === 'ALL' || s.destination === destination) &&
      !usedStatusCodes.has(s.code)
  );

  function getShipmentStatus(trackingCode: string): string {
    const map: Record<string, string> = {
      RECEIVED_WAREHOUSE: 'PROCESSING',
      PREPARED_SHIPPING: 'PROCESSING',
      DEPARTED_CONSOLIDATION: 'SHIPPED',
      ARRIVED_AIRPORT: 'SHIPPED',
      CUSTOMS_CLEARED_ORIGIN: 'SHIPPED',
      IN_TRANSIT: 'IN_TRANSIT',
      TRANSIT_HUB: 'IN_TRANSIT',
      ARRIVED_DESTINATION: 'ARRIVED',
      CUSTOMS_CLEARED_DEST: 'ARRIVED',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
    };
    return map[trackingCode] || 'PROCESSING';
  }

  useEffect(() => {
    Promise.all([api.getTrackingStatuses(), api.getTrackingLocations()])
      .then(([s, l]) => {
        setTrackingStatuses(s.filter((x: any) => x.isActive));
        setTrackingLocations(l.filter((x: any) => x.isActive));
      })
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingStatus) {
      alert('Select a tracking status');
      return;
    }
    if (!locationCode) {
      alert('Select a location');
      return;
    }

    setLoading(true);
    const selectedStatus = trackingStatuses.find((s) => s.code === trackingStatus);
    const selectedLocation = trackingLocations.find((l) => l.code === locationCode);
    const shipmentStatus = getShipmentStatus(trackingStatus);

    try {
      await api.updateMasterShipmentStatus(masterShipment.id, {
        status: shipmentStatus,
        trackingCode: trackingStatus,
        notes: `${selectedStatus?.label || trackingStatus}${notes ? ' — ' + notes : ''}`,
        location: selectedLocation?.label || locationCode,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Update Tracking</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">
              {masterShipment.masterTrackingNo}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              This updates all {masterShipment.shipments.length} linked shipments
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Destination</p>
              <p className="text-sm font-medium text-surface-900">
                {destination.replace(/_/g, ' ') || 'Not set'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Tracking Status *
              </label>
              {filteredStatuses.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-sm text-amber-700 font-medium">All tracking statuses have been used</p>
                  <p className="text-xs text-amber-600 mt-0.5">Every available status has already been applied to this shipment</p>
                </div>
              ) : (
                <select
                  value={trackingStatus}
                  onChange={(e) => setTrackingStatus(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
                >
                  <option value="">Select tracking status...</option>
                  {filteredStatuses.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
              {trackingStatus && (
                <p className="text-xs text-surface-400 mt-1.5">
                  Shipment status will be set to:{' '}
                  <span className="font-medium text-surface-600">
                    {getShipmentStatus(trackingStatus).replace(/_/g, ' ')}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Location *</label>
              <select
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select location...</option>
                {trackingLocations.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                    {l.country ? ` (${l.country})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Expected to arrive in 3 days..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>

            {trackingStatus && locationCode && (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                  Preview
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {filteredStatuses.find((s) => s.code === trackingStatus)?.label}
                    </p>
                    <p className="text-xs text-surface-500">
                      📍 {trackingLocations.find((l) => l.code === locationCode)?.label}
                    </p>
                    {notes && <p className="text-xs text-surface-400 mt-0.5">{notes}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || filteredStatuses.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all"
              >
                {loading ? 'Updating...' : 'Update All Shipments'}
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

// ════════════════════════════════════════════════════════════════════
// ADD DETAILS & GENERATE BILL MODAL
// ════════════════════════════════════════════════════════════════════

function AddDetailsModal({
  shipment,
  onClose,
  onSaved,
}: {
  shipment: any;
  onClose: () => void;
  onSaved: () => void;
}) {
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
              {shipment.user.firstName} {shipment.user.lastName} ·{' '}
              {shipment.method === 'AIR' ? '✈️ Air' : '🚢 Sea'} · {shipment.packages.length} packages
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        {result ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Scale size={28} className="text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-surface-900">Bill Generated!</h4>
              <p className="text-sm text-surface-500 mt-1">{result.bill.billNumber}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Billing Method</span>
                  <span className="font-medium">{result.shipment.billingMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Weight</span>
                  <span className="font-medium">{result.shipment.weightKg} kg</span>
                </div>
                {result.shipment.volumeCBM && (
                  <div className="flex justify-between">
                    <span className="text-surface-500">Volume</span>
                    <span className="font-medium">{result.shipment.volumeCBM} CBM</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-500">Rate</span>
                  <span className="font-medium">
                    ${result.rate.freightCostUSD}/{result.rate.billingUnit}
                  </span>
                </div>
                <div className="border-t border-surface-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-surface-500">Freight Cost (USD)</span>
                    <span className="font-medium">
                      ${result.shipment.freightUSD?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-surface-500">Packing Fee (USD)</span>
                    <span className="font-medium">
                      ${result.shipment.packingFeeUSD?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-surface-500">
                      Clearing Fee ({result.shipment.clearingCurrency})
                    </span>
                    <span className="font-medium">
                      {result.shipment.clearingCurrency === 'NGN'
                        ? '₦'
                        : result.shipment.clearingCurrency === 'GHS'
                          ? 'GH₵'
                          : '$'}
                      {result.shipment.clearingFee?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-surface-400 mt-1">
                  <span>Exchange Rate</span>
                  <span>
                    1 USD ={' '}
                    {result.shipment.localCurrency === 'NGN'
                      ? '₦'
                      : result.shipment.localCurrency === 'GHS'
                        ? 'GH₵'
                        : '$'}
                    {result.shipment.exchangeRate?.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-surface-200 pt-2 mt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total ({result.shipment.localCurrency})</span>
                    <span className="text-brand-600">
                      {result.shipment.localCurrency === 'NGN'
                        ? '₦'
                        : result.shipment.localCurrency === 'GHS'
                          ? 'GH₵'
                          : '$'}
                      {result.shipment.totalLocal?.toLocaleString()}
                    </span>
                  </div>
                </div>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {isSea && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Billing Method
                </label>
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

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Weight (kg) *
              </label>
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

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Packing Fee (₦)
              </label>
              <input
                type="number"
                value={packingFee}
                onChange={(e) => setPackingFee(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Additional Fees (₦)
              </label>
              <input
                type="number"
                value={additionalFees}
                onChange={(e) => setAdditionalFees(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

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