'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  ChevronDown,
  PackageCheck,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Calendar,
  User,
  Phone,
  Truck,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface PickupRequest {
  id: string;
  status: string;
  pickupType: string;
  delegateName: string | null;
  delegatePhone: string | null;
  scheduledDate: string;
  scheduledTime: string;
  warehouseName: string;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
  shipment: { shipmentNumber: string; method: string };
  pickupSlot: { id: string; startTime: string; endTime: string } | null;
}

interface PickupSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxPickups: number;
  bookedCount: number;
  isActive: boolean;
  _count?: { pickupRequests: number };
}

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

function formatTime(time: string) {
  const parts = time.split(':');
  const hour = parseInt(parts[0]);
  const minute = parts[1];
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

export default function PickupsPage() {
  const [tab, setTab] = useState<'requests' | 'slots'>('requests');
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusModal, setStatusModal] = useState<PickupRequest | null>(null);
  const [slotModal, setSlotModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPickupRequests(
        filterStatus || undefined,
        filterDate || undefined,
      );
      setPickups(data);
    } catch (err) {
      console.error('Failed to fetch pickups:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPickupSlots(slotDate);
      setSlots(data);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  }, [slotDate]);

  useEffect(() => {
    if (tab === 'requests') fetchPickups();
    else fetchSlots();
  }, [tab, fetchPickups, fetchSlots]);

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════

  async function handleUpdateStatus(pickupId: string, status: string, notes: string) {
    setActionLoading(true);
    try {
      await api.updatePickupStatus(pickupId, { status, notes: notes || undefined });
      setStatusModal(null);
      await fetchPickups();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleSlot(slotId: string, isActive: boolean) {
    try {
      await api.updatePickupSlot(slotId, { isActive: !isActive });
      await fetchSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to update slot');
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Delete this slot? This cannot be undone.')) return;
    try {
      await api.deletePickupSlot(slotId);
      await fetchSlots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Pickups</h1>
          <p className="text-surface-500 mt-1">Manage pickup requests and time slots</p>
        </div>
        <button
          onClick={() => (tab === 'requests' ? fetchPickups() : fetchSlots())}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('requests')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'requests'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Pickup Requests
        </button>
        <button
          onClick={() => setTab('slots')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'slots'
              ? 'bg-white text-surface-900 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Time Slots
        </button>
      </div>

      {tab === 'requests' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-surface-500 hover:text-surface-700"
                >
                  Clear date
                </button>
              )}
            </div>
          </div>

          {/* Pickup Requests Table */}
          <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pickups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-surface-400">
                <PackageCheck size={32} className="mb-2" />
                <p className="text-sm">No pickup requests found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Shipment</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Delegate</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((pickup) => (
                    <tr key={pickup.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-surface-900">
                          {pickup.user.firstName} {pickup.user.lastName}
                        </p>
                        <p className="text-xs text-surface-500">{pickup.user.email}</p>
                        {pickup.user.phone && (
                          <p className="text-xs text-surface-400">{pickup.user.phone}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-surface-600">
                          {pickup.shipment.shipmentNumber}
                        </span>
                        <p className="text-xs text-surface-400">
                          {pickup.shipment.method === 'AIR' ? '✈️ Air' : '🚢 Sea'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          pickup.pickupType === 'SELF'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          <User size={12} />
                          {pickup.pickupType === 'SELF' ? 'Self' : 'Delegate'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-surface-900">
                          {formatDate(pickup.scheduledDate)}
                        </p>
                        <p className="text-xs text-surface-500 flex items-center gap-1">
                          <Clock size={11} /> {pickup.scheduledTime}
                        </p>
                      </td>
                      <td className="p-4">
                        {pickup.pickupType === 'DELEGATE' ? (
                          <div>
                            <p className="text-sm text-surface-900">{pickup.delegateName}</p>
                            <p className="text-xs text-surface-500 flex items-center gap-1">
                              <Phone size={11} /> {pickup.delegatePhone}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-surface-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={pickup.status} />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setStatusModal(pickup)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-400/10 text-brand-600 text-xs font-medium hover:bg-brand-400/20 transition-all"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Slot Management */}
          <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-surface-500" />
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <button
                onClick={() => setSlotModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 transition-all"
              >
                <Plus size={16} /> Add Slots
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-surface-400">
                <Clock size={32} className="mb-2" />
                <p className="text-sm">No slots for this date</p>
                <button
                  onClick={() => setSlotModal(true)}
                  className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  + Create slots
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all ${
                      slot.isActive
                        ? 'border-surface-200 bg-white'
                        : 'border-surface-100 bg-surface-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-semibold text-surface-900">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSlot(slot.id, slot.isActive)}
                          className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                          title={slot.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {slot.isActive ? (
                            <ToggleRight size={20} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={20} className="text-surface-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-surface-500">
                        <span className="font-medium text-surface-700">{slot.bookedCount}</span> / {slot.maxPickups} booked
                      </div>
                      <div className={`w-full max-w-[100px] h-2 rounded-full bg-surface-100 ml-3`}>
                        <div
                          className={`h-full rounded-full transition-all ${
                            slot.bookedCount >= slot.maxPickups
                              ? 'bg-red-500'
                              : slot.bookedCount > slot.maxPickups * 0.7
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((slot.bookedCount / slot.maxPickups) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
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

      {/* Create Slots Modal */}
      {slotModal && (
        <CreateSlotsModal
          date={slotDate}
          onClose={() => setSlotModal(false)}
          onCreated={() => { setSlotModal(false); fetchSlots(); }}
        />
      )}
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
  pickup: PickupRequest;
  onClose: () => void;
  onUpdate: (id: string, status: string, notes: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(pickup.status);
  const [notes, setNotes] = useState(pickup.notes || '');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">Update Pickup Status</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Pickup Info */}
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 space-y-1">
            <p className="text-sm font-medium">{pickup.user.firstName} {pickup.user.lastName}</p>
            <p className="text-xs text-surface-500 font-mono">{pickup.shipment.shipmentNumber}</p>
            <p className="text-xs text-surface-500">{formatDate(pickup.scheduledDate)} · {pickup.scheduledTime}</p>
            {pickup.pickupType === 'DELEGATE' && (
              <p className="text-xs text-purple-600">Delegate: {pickup.delegateName} ({pickup.delegatePhone})</p>
            )}
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <button
            onClick={() => onUpdate(pickup.id, status, notes)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CREATE SLOTS MODAL
// ════════════════════════════════════════════════════════════════════

function CreateSlotsModal({
  date,
  onClose,
  onCreated,
}: {
  date: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [slots, setSlots] = useState([
    { startTime: '09:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '16:00' },
  ]);
  const [maxPickups, setMaxPickups] = useState(5);
  const [loading, setLoading] = useState(false);

  function addSlot() {
    setSlots([...slots, { startTime: '', endTime: '' }]);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: 'startTime' | 'endTime', value: string) {
    const updated = [...slots];
    updated[index][field] = value;
    setSlots(updated);
  }

  async function handleCreate() {
    const validSlots = slots.filter((s) => s.startTime && s.endTime);
    if (validSlots.length === 0) {
      alert('Please add at least one valid slot');
      return;
    }

    setLoading(true);
    try {
      await api.bulkCreatePickupSlots({ date, slots: validSlots, maxPickups });
      onCreated();
    } catch (err: any) {
      alert(err.message || 'Failed to create slots');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Create Pickup Slots</h3>
            <p className="text-sm text-surface-500 mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Max pickups per slot */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Max pickups per slot
            </label>
            <input
              type="number"
              value={maxPickups}
              onChange={(e) => setMaxPickups(parseInt(e.target.value) || 1)}
              min={1}
              className="w-24 px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {/* Slot list */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-surface-700">Time Slots</label>
            {slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <span className="text-surface-400">to</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  onClick={() => removeSlot(index)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addSlot}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} /> Add time slot
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating...' : `Create ${slots.filter((s) => s.startTime && s.endTime).length} Slots`}
          </button>
        </div>
      </div>
    </div>
  );
}