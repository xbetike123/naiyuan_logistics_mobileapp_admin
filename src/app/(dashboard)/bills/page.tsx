'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  ChevronDown,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  paidAt: string | null;
  metadata: any;
  createdAt: string;
}

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
  payments: Payment[];
}

const STATUSES = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [verifyModal, setVerifyModal] = useState<{ payment: Payment; bill: BillItem } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Count pending payments
  const pendingPaymentsCount = bills.filter(
    (b) => b.payments?.[0]?.status === 'PENDING'
  ).length;

  function getPaymentStatus(bill: BillItem) {
    if (bill.status === 'PAID') return 'PAID';
    const latestPayment = bill.payments?.[0];
    if (!latestPayment) return 'NO_PAYMENT';
    return latestPayment.status; // PENDING, COMPLETED, FAILED
  }

  function renderPaymentBadge(bill: BillItem) {
    const status = getPaymentStatus(bill);
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} /> Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock size={12} /> Proof Uploaded
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} /> Verified
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-500">
            <Clock size={12} /> Awaiting
          </span>
        );
    }
  }

  async function handleVerify(paymentId: string, status: 'APPROVED' | 'REJECTED', notes: string) {
    setActionLoading(true);
    try {
      await api.verifyPayment(paymentId, { status, notes: notes || undefined });
      setVerifyModal(null);
      await fetchBills();
    } catch (err: any) {
      alert(err.message || 'Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Bills</h1>
          <p className="text-surface-500 mt-1">
            {bills.length} bill{bills.length !== 1 ? 's' : ''}
            {pendingPaymentsCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <AlertTriangle size={11} /> {pendingPaymentsCount} pending verification
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchBills}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              placeholder="Search bill number, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
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
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
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
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Bill #
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Shipment
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Bill Status
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => {
                const latestPayment = bill.payments?.[0];
                const hasPendingPayment = latestPayment?.status === 'PENDING';

                return (
                  <tr
                    key={bill.id}
                    className={`border-b border-surface-50 transition-colors ${
                      hasPendingPayment
                        ? 'bg-amber-50/30 hover:bg-amber-50/50'
                        : 'hover:bg-surface-50/50'
                    }`}
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium text-surface-900">
                        {bill.billNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-surface-900">
                        {bill.user.firstName} {bill.user.lastName}
                      </p>
                      <p className="text-xs text-surface-500">{bill.user.email}</p>
                    </td>
                    <td className="p-4">
                      {bill.shipment ? (
                        <span className="font-mono text-sm text-surface-600">
                          {bill.shipment.shipmentNumber}
                        </span>
                      ) : (
                        <span className="text-surface-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-surface-900">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      <p className="text-xs text-surface-500">
                        Ship: {formatCurrency(bill.shippingFee)} · Clear:{' '}
                        {formatCurrency(bill.clearingFee)}
                      </p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="p-4">{renderPaymentBadge(bill)}</td>
                    <td className="p-4 text-sm text-surface-500">
                      {formatDate(bill.dueDate)}
                    </td>
                    <td className="p-4">
                      {hasPendingPayment && latestPayment ? (
                        <button
                          onClick={() =>
                            setVerifyModal({ payment: latestPayment, bill })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-all"
                        >
                          <Eye size={13} /> Review
                        </button>
                      ) : (
                        <span className="text-xs text-surface-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Verify Payment Modal */}
      {verifyModal && (
        <VerifyPaymentModal
          payment={verifyModal.payment}
          bill={verifyModal.bill}
          onClose={() => setVerifyModal(null)}
          onVerify={handleVerify}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VERIFY PAYMENT MODAL
// ════════════════════════════════════════════════════════════════════

function VerifyPaymentModal({
  payment,
  bill,
  onClose,
  onVerify,
  loading,
}: {
  payment: Payment;
  bill: BillItem;
  onClose: () => void;
  onVerify: (paymentId: string, status: 'APPROVED' | 'REJECTED', notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  const proofUrl = (payment.metadata as any)?.proofUrl;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Review Payment</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">{bill.billNumber}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Customer</p>
              <p className="text-sm font-medium text-surface-900">
                {bill.user.firstName} {bill.user.lastName}
              </p>
              <p className="text-xs text-surface-500">{bill.user.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Amount</p>
              <p className="text-sm font-bold text-surface-900">
                {formatCurrency(bill.totalAmount)}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Method</span>
              <span className="font-medium text-surface-900">
                {payment.method.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Reference</span>
              <span className="font-mono text-xs text-surface-700">{payment.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Submitted</span>
              <span className="text-surface-700">{formatDate(payment.createdAt)}</span>
            </div>
            {proofUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Proof</span>
                <span className="text-xs text-brand-600 font-medium">{proofUrl}</span>
              </div>
            )}
          </div>

          {/* Shipment Info */}
          {bill.shipment && (
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="text-xs text-surface-500">Shipment</p>
              <p className="text-sm font-mono font-medium text-surface-900">
                {bill.shipment.shipmentNumber}
              </p>
              <p className="text-xs text-surface-500">
                {bill.shipment.method === 'AIR' ? '✈️ Air' : '🚢 Sea'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Verification Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Payment confirmed via bank statement..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onVerify(payment.id, 'APPROVED', notes)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              <CheckCircle size={16} /> {loading ? 'Processing...' : 'Approve Payment'}
            </button>
            <button
              onClick={() => onVerify(payment.id, 'REJECTED', notes)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              <XCircle size={16} /> {loading ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}