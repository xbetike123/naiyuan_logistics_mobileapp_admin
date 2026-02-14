'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  ChevronDown,
  X,
  Package as PackageIcon,
  Check,
  Camera,
  StickyNote,
  ArrowUpDown,
} from 'lucide-react';

interface PackageItem {
  id: string;
  trackingNumber: string;
  description: string | null;
  status: string;
  photoUrls: string[];
  warehouseNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const STATUSES = ['EN_ROUTE', 'ARRIVED', 'IN_SHIPMENT', 'DELIVERED'];

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPackages(filterStatus || undefined, search || undefined);
      setPackages(data);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === packages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(packages.map((p) => p.id)));
    }
  }

  async function handleBulkUpdate(status: string) {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      await api.bulkUpdatePackageStatus(Array.from(selected), status);
      setSelected(new Set());
      setShowBulkMenu(false);
      await fetchPackages();
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdatePackage(id: string, data: any) {
    setActionLoading(true);
    try {
      await api.updatePackage(id, data);
      setEditingPkg(null);
      await fetchPackages();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Packages</h1>
          <p className="text-surface-500 mt-1">
            {packages.length} package{packages.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={fetchPackages}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search tracking number, description, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
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
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>

          {selected.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all"
              >
                <ArrowUpDown size={16} />
                Update {selected.size} selected
                <ChevronDown size={14} />
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-200 py-1 z-20">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleBulkUpdate(s)}
                      disabled={actionLoading}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors disabled:opacity-50"
                    >
                      Mark as {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <PackageIcon size={32} className="mb-2" />
            <p className="text-sm">No packages found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === packages.length && packages.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-surface-300 text-brand-500 focus:ring-brand-400"
                  />
                </th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tracking</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Description</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(pkg.id)}
                      onChange={() => toggleSelect(pkg.id)}
                      className="rounded border-surface-300 text-brand-500 focus:ring-brand-400"
                    />
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-surface-900">{pkg.trackingNumber}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-surface-900">
                        {pkg.user.firstName} {pkg.user.lastName}
                      </p>
                      <p className="text-xs text-surface-500">{pkg.user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-surface-600 max-w-[200px] truncate">
                      {pkg.description || '—'}
                    </p>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={pkg.status} />
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-surface-500">{formatDate(pkg.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingPkg(pkg)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingPkg && (
        <EditPackageModal
          pkg={editingPkg}
          onClose={() => setEditingPkg(null)}
          onSave={handleUpdatePackage}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

function EditPackageModal({
  pkg,
  onClose,
  onSave,
  loading,
}: {
  pkg: PackageItem;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(pkg.status);
  const [description, setDescription] = useState(pkg.description || '');
  const [warehouseNotes, setWarehouseNotes] = useState(pkg.warehouseNotes || '');
  const [photoUrls, setPhotoUrls] = useState(pkg.photoUrls.join('\n'));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = {};
    if (status !== pkg.status) data.status = status;
    if (description !== (pkg.description || '')) data.description = description;
    if (warehouseNotes !== (pkg.warehouseNotes || '')) data.warehouseNotes = warehouseNotes;

    const urls = photoUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    if (JSON.stringify(urls) !== JSON.stringify(pkg.photoUrls)) {
      data.photoUrls = urls;
    }

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }

    onSave(pkg.id, data);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Edit Package</h3>
            <p className="text-sm text-surface-500 font-mono mt-0.5">{pkg.trackingNumber}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1">Customer</p>
            <p className="text-sm font-medium text-surface-900">
              {pkg.user.firstName} {pkg.user.lastName}
            </p>
            <p className="text-xs text-surface-500">{pkg.user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Check size={14} /> Status
              </span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Package description"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <StickyNote size={14} /> Warehouse Notes
              </span>
            </label>
            <textarea
              value={warehouseNotes}
              onChange={(e) => setWarehouseNotes(e.target.value)}
              placeholder="Inspection notes, weight, dimensions..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Camera size={14} /> Photo URLs
              </span>
            </label>
            <textarea
              value={photoUrls}
              onChange={(e) => setPhotoUrls(e.target.value)}
              placeholder="One URL per line"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : 'Save Changes'}
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