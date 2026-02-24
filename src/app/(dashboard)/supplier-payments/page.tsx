'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ImageUpload } from '@/components/image-upload';
import {
  Search,
  RefreshCw,
  ChevronDown,
  CreditCard,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  DollarSign,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface SupplierPayment {
  id: string;
  paymentNumber: string;
  status: string;
  platform: string;
  supplierName: string;
  amountCNY: number;
  exchangeRate: number;
  amountNGN: number;
  serviceFeeNGN: number;
  totalNGN: number;
  serviceFeePercent: number;
  reference: string | null;
  qrCodeUrl: string | null;
  alipayNumber: string | null;
  wechatNumber: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  userProofUrl: string | null;
  userProofUploadedAt: string | null;
  countdownStartedAt: string | null;
  countdownDeadline: string | null;
  adminProofUrl: string | null;
  adminProofUploadedAt: string | null;
  verifiedBy: string | null;
  paidBy: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  timeline: { id: string; status: string; note: string | null; createdAt: string }[];
}

const STATUSES = [
  'CREATED', 'PENDING_USER_PAYMENT', 'PROOF_UPLOADED', 'PAYMENT_VERIFIED',
  'SUPPLIER_PAID', 'COMPLETED', 'CANCELLED', 'FAILED',
];

const PLATFORM_LABELS: Record<string, string> = {
  ALIPAY: '🔵 Alipay',
  WECHAT: '🟢 WeChat',
  BANK_TRANSFER: '🏦 Bank Transfer',
};

function statusColor(status: string) {
  switch (status) {
    case 'CREATED': return 'bg-gray-100 text-gray-700';
    case 'PENDING_USER_PAYMENT': return 'bg-amber-50 text-amber-700';
    case 'PROOF_UPLOADED': return 'bg-blue-50 text-blue-700';
    case 'PAYMENT_VERIFIED': return 'bg-indigo-50 text-indigo-700';
    case 'SUPPLIER_PAID': return 'bg-emerald-50 text-emerald-700';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED': return 'bg-gray-100 text-gray-600';
    case 'FAILED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function CountdownBadge({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        setIsExpired(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
    }`}>
      <Clock size={10} /> {remaining}
    </span>
  );
}

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<SupplierPayment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSupplierPayments(
        filterStatus || undefined,
        search || undefined,
      );
      setPayments(data);
    } catch (err) {
      console.error('Failed to fetch supplier payments:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleVerify(id: string, notes: string) {
    setActionLoading(true);
    try {
      await api.verifySupplierPayment(id, { adminNotes: notes || undefined });
      setDetailModal(null);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to verify');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid(id: string, proofUrl: string, notes: string) {
    setActionLoading(true);
    try {
      await api.markSupplierPaid(id, { adminProofUrl: proofUrl, adminNotes: notes || undefined });
      setDetailModal(null);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: string, reason: string) {
    setActionLoading(true);
    try {
      await api.rejectSupplierPayment(id, reason);
      setDetailModal(null);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  }

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'PENDING_USER_PAYMENT').length,
    proofUploaded: payments.filter(p => p.status === 'PROOF_UPLOADED').length,
    verified: payments.filter(p => p.status === 'PAYMENT_VERIFIED').length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Supplier Payments</h1>
          <p className="text-surface-500 mt-1">Manage payment remittance to Chinese suppliers</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-900' },
          { label: 'Awaiting Payment', value: stats.pending, color: 'text-amber-600' },
          { label: 'Proof Uploaded', value: stats.proofUploaded, color: 'text-blue-600', highlight: true },
          { label: 'Verified', value: stats.verified, color: 'text-indigo-600' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border p-4 ${stat.highlight ? 'border-blue-300 ring-1 ring-blue-200' : 'border-surface-200/60'}`}>
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
              placeholder="Search by payment # or supplier..."
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <CreditCard size={32} className="mb-2" />
            <p className="text-sm">No supplier payments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Payment</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Supplier</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Platform</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Amount</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-surface-900">{p.paymentNumber}</span>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(p.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-surface-900">{p.user.firstName} {p.user.lastName}</p>
                    <p className="text-xs text-surface-500">{p.user.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-surface-900">{p.supplierName}</p>
                    {p.reference && <p className="text-xs text-surface-400">Ref: {p.reference}</p>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium">{PLATFORM_LABELS[p.platform] || p.platform}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-surface-900">¥{p.amountCNY.toLocaleString()}</p>
                    <p className="text-xs text-surface-500">₦{p.totalNGN.toLocaleString()}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                    {p.countdownDeadline && p.status === 'PROOF_UPLOADED' && (
                      <div className="mt-1">
                        <CountdownBadge deadline={p.countdownDeadline} />
                      </div>
                    )}
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
                      {p.status === 'PROOF_UPLOADED' && (
                        <button
                          onClick={() => setDetailModal(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-medium hover:bg-blue-500/20 transition-all"
                        >
                          <Shield size={12} /> Verify
                        </button>
                      )}
                      {p.status === 'PAYMENT_VERIFIED' && (
                        <button
                          onClick={() => setDetailModal(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                        >
                          <CheckCircle size={12} /> Pay Supplier
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
        <PaymentDetailModal
          payment={detailModal}
          onClose={() => setDetailModal(null)}
          onVerify={handleVerify}
          onMarkPaid={handleMarkPaid}
          onReject={handleReject}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PAYMENT DETAIL MODAL
// ════════════════════════════════════════════════════════════════════

function PaymentDetailModal({
  payment,
  onClose,
  onVerify,
  onMarkPaid,
  onReject,
  loading,
}: {
  payment: SupplierPayment;
  onClose: () => void;
  onVerify: (id: string, notes: string) => void;
  onMarkPaid: (id: string, proofUrl: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{payment.paymentNumber}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColor(payment.status)}`}>
              {payment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer */}
          <div>
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Customer</h4>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
              <p className="text-sm font-medium">{payment.user.firstName} {payment.user.lastName}</p>
              <p className="text-xs text-surface-500">{payment.user.email}</p>
            </div>
          </div>

          {/* Supplier & Platform */}
          <div>
            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Supplier</h4>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
              <p className="text-sm font-medium">{payment.supplierName}</p>
              <p className="text-xs text-surface-500">{PLATFORM_LABELS[payment.platform]}</p>
              {payment.alipayNumber && <p className="text-xs text-surface-400">Alipay: {payment.alipayNumber}</p>}
              {payment.wechatNumber && <p className="text-xs text-surface-400">WeChat: {payment.wechatNumber}</p>}
              {payment.bankName && (
                <>
                  <p className="text-xs text-surface-400">Bank: {payment.bankName}</p>
                  <p className="text-xs text-surface-400">Account: {payment.accountHolder} · {payment.accountNumber}</p>
                </>
              )}
            </div>
          </div>

          {/* Amounts */}
          <div className="p-4 rounded-xl bg-surface-950 text-white">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-surface-400">Amount</span>
              <span className="text-lg font-bold">¥{payment.amountCNY.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-surface-400 mb-1">
              <span>Converted (×{payment.exchangeRate})</span>
              <span>₦{payment.amountNGN.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-surface-400 mb-1">
              <span>Service Fee ({(payment.serviceFeePercent * 100).toFixed(0)}%)</span>
              <span>₦{payment.serviceFeeNGN.toLocaleString()}</span>
            </div>
            <div className="border-t border-surface-700 mt-2 pt-2 flex justify-between font-semibold">
              <span className="text-amber-400 text-sm">Total</span>
              <span className="text-amber-400 text-sm">₦{payment.totalNGN.toLocaleString()}</span>
            </div>
          </div>

          {/* Countdown */}
          {payment.countdownDeadline && ['PROOF_UPLOADED'].includes(payment.status) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={16} className="text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-700">2-Hour Countdown Active</p>
                <CountdownBadge deadline={payment.countdownDeadline} />
              </div>
            </div>
          )}

          {/* QR Code */}
          {payment.qrCodeUrl && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Supplier QR Code</h4>
              <img src={payment.qrCodeUrl} alt="QR Code" className="w-40 h-40 rounded-xl border border-surface-200 object-contain" />
            </div>
          )}

          {/* User Proof */}
          {payment.userProofUrl && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">User Payment Proof</h4>
              <a href={payment.userProofUrl} target="_blank" rel="noopener noreferrer">
                <img src={payment.userProofUrl} alt="Payment proof" className="w-full max-h-60 rounded-xl border border-surface-200 object-contain cursor-pointer hover:opacity-90 transition-opacity" />
              </a>
              <p className="text-xs text-surface-400 mt-1">Uploaded {payment.userProofUploadedAt ? formatDate(payment.userProofUploadedAt) : ''}</p>
            </div>
          )}

          {/* Admin Proof */}
          {payment.adminProofUrl && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Admin Payment Proof</h4>
              <img src={payment.adminProofUrl} alt="Admin proof" className="w-full max-h-60 rounded-xl border border-surface-200 object-contain" />
            </div>
          )}

          {/* Timeline */}
          {payment.timeline && payment.timeline.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Timeline</h4>
              <div className="space-y-2">
                {payment.timeline.map((t) => (
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
          {payment.status === 'PROOF_UPLOADED' && !showReject && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Admin Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onVerify(payment.id, notes)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Verifying...' : '✓ Verify Payment'}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 text-sm font-medium hover:bg-red-500/20 transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {showReject && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1.5">Rejection Reason *</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this being rejected?" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReject(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => onReject(payment.id, rejectReason)}
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          )}

          {payment.status === 'PAYMENT_VERIFIED' && (
            <div className="space-y-3 pt-2">
              <div>
                <ImageUpload
                  value={proofUrl}
                  onChange={(url) => setProofUrl(url)}
                  label="Admin Payment Proof *"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              </div>
              <button
                onClick={() => onMarkPaid(payment.id, proofUrl, notes)}
                disabled={loading || !proofUrl.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Processing...' : '✓ Mark Supplier as Paid'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
