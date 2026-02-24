'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  ChevronDown,
  MapPin,
  X,
  Send,
  Eye,
  Clock,
  CheckCircle,
  Package,
  Truck,
  Building2,
  Phone,
  User,
  DollarSign,
  FileText,
} from 'lucide-react';

interface ChinaPickup {
  id: string;
  requestNumber: string;
  status: string;
  pickupType: string;
  goodsType: string;
  weightRange: string;
  city: string;
  supplierName: string;
  supplierPhone: string;
  supplierAddress: string;
  notes: string | null;
  quotedPriceCNY: number | null;
  quotedPriceNGN: number | null;
  exchangeRateUsed: number | null;
  quoteNotes: string | null;
  quoteSentAt: string | null;
  quoteAcceptedAt: string | null;
  quoteDeclinedAt: string | null;
  declineReason: string | null;
  supplierContactedAt: string | null;
  goodsPickedUpAt: string | null;
  arrivedWarehouseAt: string | null;
  assignedTo: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  timeline: { id: string; status: string; note: string | null; createdAt: string }[];
}

const STATUSES = [
  'CREATED', 'UNDER_REVIEW', 'QUOTE_SENT', 'CONFIRMED', 'DECLINED',
  'SUPPLIER_CONTACTED', 'GOODS_PICKED_UP', 'ARRIVED_WAREHOUSE', 'CANCELLED',
];

const CITIES = ['GUANGZHOU', 'YIWU', 'SHENZHEN', 'SHANGHAI', 'FOSHAN', 'DONGGUAN'];

const GOODS_LABELS: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  CLOTHING_TEXTILES: 'Clothing & Textiles',
  MACHINERY_PARTS: 'Machinery Parts',
  RAW_MATERIALS: 'Raw Materials',
  COSMETICS_BEAUTY: 'Cosmetics & Beauty',
  MIXED_GOODS: 'Mixed Goods',
  OTHER: 'Other',
};

const WEIGHT_LABELS: Record<string, string> = {
  LIGHT: '0–30 kg',
  MEDIUM: '30–100 kg',
  HEAVY: '100–500 kg',
  EXTRA_HEAVY: '500+ kg',
};

function statusColor(status: string) {
  switch (status) {
    case 'CREATED': return 'bg-gray-100 text-gray-700';
    case 'UNDER_REVIEW': return 'bg-blue-50 text-blue-700';
    case 'QUOTE_SENT': return 'bg-amber-50 text-amber-700';
    case 'CONFIRMED': return 'bg-emerald-50 text-emerald-700';
    case 'DECLINED': return 'bg-red-50 text-red-700';
    case 'SUPPLIER_CONTACTED': return 'bg-indigo-50 text-indigo-700';
    case 'GOODS_PICKED_UP': return 'bg-purple-50 text-purple-700';
    case 'ARRIVED_WAREHOUSE': return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ChinaPickupsPage() {
  const [pickups, setPickups] = useState<ChinaPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<ChinaPickup | null>(null);
  const [quoteModal, setQuoteModal] = useState<ChinaPickup | null>(null);
  const [statusModal, setStatusModal] = useState<ChinaPickup | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getChinaPickups(
        filterStatus || undefined,
        search || undefined,
        filterCity || undefined,
      );
      setPickups(data);
    } catch (err) {
      console.error('Failed to fetch china pickups:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCity, search]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchPickups(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleSendQuote(id: string, quotedPriceCNY: number, exchangeRate: number | undefined, quoteNotes: string) {
    setActionLoading(true);
    try {
      await api.sendChinaPickupQuote(id, {
        quotedPriceCNY,
        exchangeRate: exchangeRate || undefined,
        quoteNotes: quoteNotes || undefined,
      });
      setQuoteModal(null);
      await fetchPickups();
    } catch (err: any) {
      alert(err.message || 'Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string, note: string) {
    setActionLoading(true);
    try {
      await api.updateChinaPickupStatus(id, { status, note: note || undefined });
      setStatusModal(null);
      setDetailModal(null);
      await fetchPickups();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  const stats = {
    total: pickups.length,
    created: pickups.filter(p => p.status === 'CREATED').length,
    quoteSent: pickups.filter(p => p.status === 'QUOTE_SENT').length,
    confirmed: pickups.filter(p => p.status === 'CONFIRMED').length,
    inProgress: pickups.filter(p => ['SUPPLIER_CONTACTED', 'GOODS_PICKED_UP'].includes(p.status)).length,
    completed: pickups.filter(p => p.status === 'ARRIVED_WAREHOUSE').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">China Pickups</h1>
          <p className="text-surface-500 mt-1">Manage supplier goods collection requests</p>
        </div>
        <button
          onClick={fetchPickups}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-900' },
          { label: 'New', value: stats.created, color: 'text-blue-600' },
          { label: 'Quote Sent', value: stats.quoteSent, color: 'text-amber-600' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-emerald-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-indigo-600' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-surface-200/60 p-4">
            <p className="text-xs text-surface-500 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by request # or supplier..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
            >
              <option value="">All Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pickups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <MapPin size={32} className="mb-2" />
            <p className="text-sm">No pickup requests found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Request</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Supplier</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">City</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Goods</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Quote</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-surface-900">{p.requestNumber}</span>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(p.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-surface-900">{p.user.firstName} {p.user.lastName}</p>
                    <p className="text-xs text-surface-500">{p.user.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-surface-900">{p.supplierName}</p>
                    <p className="text-xs text-surface-500">{p.supplierPhone}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-surface-700">
                      <MapPin size={12} /> {p.city}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-surface-700">{GOODS_LABELS[p.goodsType] || p.goodsType}</p>
                    <p className="text-xs text-surface-400">{WEIGHT_LABELS[p.weightRange] || p.weightRange}</p>
                  </td>
                  <td className="p-4">
                    {p.quotedPriceCNY ? (
                      <div>
                        <p className="text-sm font-semibold text-surface-900">¥{p.quotedPriceCNY.toLocaleString()}</p>
                        <p className="text-xs text-surface-500">₦{p.quotedPriceNGN?.toLocaleString()}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-surface-400">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDetailModal(p)}
                        className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {['CREATED', 'UNDER_REVIEW'].includes(p.status) && (
                        <button
                          onClick={() => setQuoteModal(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-400/10 text-brand-600 text-xs font-medium hover:bg-brand-400/20 transition-all"
                        >
                          <Send size={12} /> Quote
                        </button>
                      )}
                      {['CONFIRMED', 'SUPPLIER_CONTACTED', 'GOODS_PICKED_UP'].includes(p.status) && (
                        <button
                          onClick={() => setStatusModal(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-400/10 text-brand-600 text-xs font-medium hover:bg-brand-400/20 transition-all"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <DetailModal
          pickup={detailModal}
          onClose={() => setDetailModal(null)}
          onSendQuote={(p) => { setDetailModal(null); setQuoteModal(p); }}
          onUpdateStatus={(p) => { setDetailModal(null); setStatusModal(p); }}
        />
      )}

      {/* Send Quote Modal */}
      {quoteModal && (
        <SendQuoteModal
          pickup={quoteModal}
          onClose={() => setQuoteModal(null)}
          onSend={handleSendQuote}
          loading={actionLoading}
        />
      )}

      {/* Update Status Modal */}
      {statusModal && (
        <UpdateStatusModal
          pickup={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdate={handleUpdateStatus}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════════════

function DetailModal({
  pickup,
  onClose,
  onSendQuote,
  onUpdateStatus,
}: {
  pickup: ChinaPickup;
  onClose: () => void;
  onSendQuote: (p: ChinaPickup) => void;
  onUpdateStatus: (p: ChinaPickup) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{pickup.requestNumber}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColor(pickup.status)}`}>
              {pickup.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer */}
          <div>
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Customer</h4>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
              <p className="text-sm font-medium">{pickup.user.firstName} {pickup.user.lastName}</p>
              <p className="text-xs text-surface-500">{pickup.user.email}</p>
              {pickup.user.phone && <p className="text-xs text-surface-400">{pickup.user.phone}</p>}
            </div>
          </div>

          {/* Supplier */}
          <div>
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Supplier</h4>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
              <p className="text-sm font-medium">{pickup.supplierName}</p>
              <p className="text-xs text-surface-500 flex items-center gap-1"><Phone size={11} /> {pickup.supplierPhone}</p>
              <p className="text-xs text-surface-500 flex items-center gap-1"><MapPin size={11} /> {pickup.supplierAddress}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">City</p>
              <p className="text-sm font-medium mt-0.5">{pickup.city}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Type</p>
              <p className="text-sm font-medium mt-0.5">{pickup.pickupType}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Goods</p>
              <p className="text-sm font-medium mt-0.5">{GOODS_LABELS[pickup.goodsType] || pickup.goodsType}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Weight</p>
              <p className="text-sm font-medium mt-0.5">{WEIGHT_LABELS[pickup.weightRange] || pickup.weightRange}</p>
            </div>
          </div>

          {/* Quote */}
          {pickup.quotedPriceCNY && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-semibold mb-1">Quote</p>
              <p className="text-lg font-bold text-amber-800">¥{pickup.quotedPriceCNY.toLocaleString()}</p>
              <p className="text-xs text-amber-600">≈ ₦{pickup.quotedPriceNGN?.toLocaleString()} (rate: {pickup.exchangeRateUsed})</p>
              {pickup.quoteNotes && <p className="text-xs text-amber-600 mt-1">{pickup.quoteNotes}</p>}
            </div>
          )}

          {/* Notes */}
          {pickup.notes && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">User Notes</h4>
              <p className="text-sm text-surface-600 p-3 rounded-xl bg-surface-50 border border-surface-100">{pickup.notes}</p>
            </div>
          )}

          {/* Timeline */}
          {pickup.timeline && pickup.timeline.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Timeline</h4>
              <div className="space-y-2">
                {pickup.timeline.map((t) => (
                  <div key={t.id} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-surface-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${statusColor(t.status)}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                      {t.note && <p className="text-surface-500 mt-0.5">{t.note}</p>}
                      <p className="text-surface-400">{formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {['CREATED', 'UNDER_REVIEW'].includes(pickup.status) && (
              <button
                onClick={() => onSendQuote(pickup)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 transition-all"
              >
                <Send size={14} /> Send Quote
              </button>
            )}
            {['CONFIRMED', 'SUPPLIER_CONTACTED', 'GOODS_PICKED_UP'].includes(pickup.status) && (
              <button
                onClick={() => onUpdateStatus(pickup)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 transition-all"
              >
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SEND QUOTE MODAL
// ════════════════════════════════════════════════════════════════════

function SendQuoteModal({
  pickup,
  onClose,
  onSend,
  loading,
}: {
  pickup: ChinaPickup;
  onClose: () => void;
  onSend: (id: string, price: number, rate: number | undefined, notes: string) => void;
  loading: boolean;
}) {
  const [price, setPrice] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');

  const priceCNY = parseFloat(price) || 0;
  const exchangeRate = parseFloat(rate) || 220;
  const estimatedNGN = priceCNY * exchangeRate;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">Send Quote</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
            <p className="text-sm font-medium">{pickup.requestNumber}</p>
            <p className="text-xs text-surface-500">{pickup.supplierName} · {pickup.city}</p>
            <p className="text-xs text-surface-400">{GOODS_LABELS[pickup.goodsType]} · {WEIGHT_LABELS[pickup.weightRange]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Price (CNY) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Exchange Rate (CNY→NGN)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Leave blank for auto (≈220)"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {priceCNY > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs text-amber-600">Customer will see</p>
              <p className="text-lg font-bold text-amber-800">¥{priceCNY.toLocaleString()} ≈ ₦{estimatedNGN.toLocaleString()}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the customer..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <button
            onClick={() => onSend(pickup.id, priceCNY, parseFloat(rate) || undefined, notes)}
            disabled={loading || priceCNY <= 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Sending...' : 'Send Quote to Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// UPDATE STATUS MODAL
// ════════════════════════════════════════════════════════════════════

function UpdateStatusModal({
  pickup,
  onClose,
  onUpdate,
  loading,
}: {
  pickup: ChinaPickup;
  onClose: () => void;
  onUpdate: (id: string, status: string, note: string) => void;
  loading: boolean;
}) {
  const nextStatuses: Record<string, string[]> = {
    CONFIRMED: ['SUPPLIER_CONTACTED'],
    SUPPLIER_CONTACTED: ['GOODS_PICKED_UP'],
    GOODS_PICKED_UP: ['ARRIVED_WAREHOUSE'],
  };

  const available = nextStatuses[pickup.status] || STATUSES;
  const [status, setStatus] = useState(available[0] || '');
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">Update Status</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
            <p className="text-sm font-medium">{pickup.requestNumber}</p>
            <p className="text-xs text-surface-500">Current: {pickup.status.replace(/_/g, ' ')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">New Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {available.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <button
            onClick={() => onUpdate(pickup.id, status, note)}
            disabled={loading || !status}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
