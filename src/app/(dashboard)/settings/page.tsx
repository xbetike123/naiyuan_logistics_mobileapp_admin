'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Plane,
  Ship,
  DollarSign,
  Scale,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ShippingRate {
  id: string;
  category: string;
  label: string;
  billingUnit: string;
  freightCostUSD: number;
  clearingCost: number;
  clearingCurrency: string;
  minChargeUSD: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const CATEGORIES = [
  { value: 'AIR_NORMAL', label: 'Air (Normal)', icon: '✈️', unit: 'kg', currency: 'NGN' },
  { value: 'AIR_SENSITIVE', label: 'Air (Sensitive)', icon: '✈️⚠️', unit: 'kg', currency: 'NGN' },
  { value: 'AIR_INTERNATIONAL', label: 'Air (International)', icon: '✈️🌍', unit: 'kg', currency: 'USD' },
  { value: 'SEA_NIGERIA', label: 'Sea (Nigeria)', icon: '🚢🇳🇬', unit: 'cbm', currency: 'NGN' },
  { value: 'SEA_GHANA', label: 'Sea (Ghana)', icon: '🚢🇬🇭', unit: 'cbm', currency: 'GHS' },
  { value: 'SEA_INTERNATIONAL', label: 'Sea (International)', icon: '🚢🌍', unit: 'kg', currency: 'USD' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  GHS: 'GH₵',
  USD: '$',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'rates' | 'exchange' | 'routes' | 'tracking'>('rates');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 mt-1">Manage shipping rates, exchange rates, and routes</p>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-surface-200/60 p-1 mb-6 w-fit">
        {[
          { key: 'rates', label: 'Shipping Rates', icon: Scale },
          { key: 'exchange', label: 'Exchange Rates', icon: DollarSign },
          { key: 'routes', label: 'Routes & Destinations', icon: MapPin },
          { key: 'tracking', label: 'Tracking Config', icon: Plane },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-surface-900 text-white'
                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rates' && <ShippingRatesTab />}
      {activeTab === 'exchange' && <ExchangeRatesTab />}
      {activeTab === 'routes' && <RoutesTab />}
      {activeTab === 'tracking' && <TrackingTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SHIPPING RATES TAB
// ════════════════════════════════════════════════════════════════════

function ShippingRatesTab() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShippingRates();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  async function handleToggleActive(rate: ShippingRate) {
    setActionLoading(true);
    try {
      await api.updateShippingRate(rate.id, { isActive: !rate.isActive });
      await fetchRates();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setActionLoading(false);
    }
  }

  const airRates = rates.filter((r) => r.category.startsWith('AIR'));
  const seaRates = rates.filter((r) => r.category.startsWith('SEA'));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">{rates.length} shipping rates configured</p>
        <button onClick={fetchRates} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Air Freight */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane size={18} className="text-sky-500" />
              <h3 className="text-lg font-semibold text-surface-900">Air Freight</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {airRates.map((rate) => (
                <RateCard key={rate.id} rate={rate} onEdit={() => setEditingRate(rate)} onToggle={() => handleToggleActive(rate)} actionLoading={actionLoading} />
              ))}
            </div>
          </div>

          {/* Sea Freight */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ship size={18} className="text-blue-500" />
              <h3 className="text-lg font-semibold text-surface-900">Sea Freight</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seaRates.map((rate) => (
                <RateCard key={rate.id} rate={rate} onEdit={() => setEditingRate(rate)} onToggle={() => handleToggleActive(rate)} actionLoading={actionLoading} />
              ))}
            </div>
          </div>
        </div>
      )}

      {editingRate && (
        <EditRateModal
          rate={editingRate}
          onClose={() => setEditingRate(null)}
          onSaved={() => { setEditingRate(null); fetchRates(); }}
        />
      )}
    </div>
  );
}

function RateCard({ rate, onEdit, onToggle, actionLoading }: { rate: ShippingRate; onEdit: () => void; onToggle: () => void; actionLoading: boolean }) {
  const catInfo = CATEGORIES.find((c) => c.value === rate.category);
  const symbol = CURRENCY_SYMBOLS[rate.clearingCurrency] || rate.clearingCurrency;

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all ${rate.isActive ? 'border-surface-200/60' : 'border-surface-200/40 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{catInfo?.icon || '📦'}</span>
          <div>
            <p className="text-sm font-semibold text-surface-900">{rate.label}</p>
            <p className="text-xs text-surface-400">per {rate.billingUnit}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} disabled={actionLoading} className="p-1.5 rounded-lg hover:bg-surface-50 transition-colors" title={rate.isActive ? 'Deactivate' : 'Activate'}>
            {rate.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-surface-400" />}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-50 transition-colors">
            <Pencil size={14} className="text-surface-400" />
          </button>
        </div>
      </div>

      {/* Costs */}
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-surface-50">
          <p className="text-xs text-surface-500 mb-0.5">Freight Cost (USD)</p>
          <p className="text-lg font-bold text-surface-900">${rate.freightCostUSD}<span className="text-xs font-normal text-surface-400">/{rate.billingUnit}</span></p>
        </div>
        <div className="p-3 rounded-xl bg-surface-50">
          <p className="text-xs text-surface-500 mb-0.5">Clearing Cost ({rate.clearingCurrency})</p>
          <p className="text-lg font-bold text-surface-900">{symbol}{rate.clearingCost.toLocaleString()}<span className="text-xs font-normal text-surface-400">/{rate.billingUnit}</span></p>
        </div>
        {rate.minChargeUSD > 0 && (
          <div className="p-3 rounded-xl bg-surface-50">
            <p className="text-xs text-surface-500 mb-0.5">Min. Charge</p>
            <p className="text-sm font-bold text-surface-900">${rate.minChargeUSD}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rate.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-100 text-surface-500'}`}>
          {rate.isActive ? 'Active' : 'Inactive'}
        </span>
        {rate.description && <span className="text-xs text-surface-400 truncate max-w-[150px]">{rate.description}</span>}
      </div>
    </div>
  );
}

function EditRateModal({ rate, onClose, onSaved }: { rate: ShippingRate; onClose: () => void; onSaved: () => void }) {
  const [freightCostUSD, setFreightCostUSD] = useState(rate.freightCostUSD.toString());
  const [clearingCost, setClearingCost] = useState(rate.clearingCost.toString());
  const [minChargeUSD, setMinChargeUSD] = useState(rate.minChargeUSD.toString());
  const [description, setDescription] = useState(rate.description || '');
  const [loading, setLoading] = useState(false);

  const symbol = CURRENCY_SYMBOLS[rate.clearingCurrency] || rate.clearingCurrency;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateShippingRate(rate.id, {
        freightCostUSD: parseFloat(freightCostUSD),
        clearingCost: parseFloat(clearingCost),
        minChargeUSD: parseFloat(minChargeUSD),
        description: description || null,
      });
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Edit Rate</h3>
            <p className="text-sm text-surface-500 mt-0.5">{rate.label} — per {rate.billingUnit}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Freight Cost per {rate.billingUnit} (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
              <input type="number" step="0.01" value={freightCostUSD} onChange={(e) => setFreightCostUSD(e.target.value)} required className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Clearing Cost per {rate.billingUnit} ({rate.clearingCurrency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm">{symbol}</span>
              <input type="number" step="0.01" value={clearingCost} onChange={(e) => setClearingCost(e.target.value)} required className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Min. Charge (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
              <input type="number" step="0.01" value={minChargeUSD} onChange={(e) => setMinChargeUSD(e.target.value)} className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rate description" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : 'Update Rate'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EXCHANGE RATES TAB
// ════════════════════════════════════════════════════════════════════

function ExchangeRatesTab() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExchangeRates();
      setRates(data);
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-surface-500">{rates.length} exchange rates</p>
        <div className="flex items-center gap-3">
          <button onClick={fetchRates} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all">
            <Plus size={14} /> Update Rate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 flex flex-col items-center justify-center h-48 text-surface-400">
          <DollarSign size={32} className="mb-2" />
          <p className="text-sm">No exchange rates configured</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">From</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">To</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Rate</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Effective From</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4 text-sm font-medium text-surface-900">{rate.fromCurrency}</td>
                  <td className="p-4 text-sm font-medium text-surface-900">{rate.toCurrency}</td>
                  <td className="p-4 text-sm font-bold text-surface-900">{rate.rate.toLocaleString()}</td>
                  <td className="p-4 text-sm text-surface-500">{formatDate(rate.effectiveFrom)}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${!rate.effectiveTo ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-100 text-surface-500'}`}>
                      {!rate.effectiveTo ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <ExchangeRateModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchRates(); }} />
      )}
    </div>
  );
}

function ExchangeRateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createExchangeRate({ fromCurrency, toCurrency, rate: parseFloat(rate) });
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">Update Exchange Rate</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-surface-500 bg-surface-50 p-3 rounded-xl">Adding a new rate will automatically expire the previous rate for the same currency pair.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">From</label>
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">To</label>
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
                <option value="NGN">NGN</option>
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Rate</label>
            <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required placeholder="e.g. 1550" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : 'Update Rate'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ROUTES & DESTINATIONS TAB
// ════════════════════════════════════════════════════════════════════

function RoutesTab() {
  const routes = [
    { name: 'GUANGZHOU', label: 'Guangzhou', city: 'Guangzhou, China', description: 'Main hub for general cargo and electronics', icon: '🏭' },
    { name: 'YIWU', label: 'Yiwu', city: 'Yiwu, China', description: 'Small commodities and wholesale market goods', icon: '🏪' },
    { name: 'SHENZHEN', label: 'Shenzhen', city: 'Shenzhen, China', description: 'Electronics, tech products, and accessories', icon: '💻' },
  ];

  const destinations = [
    { country: 'Nigeria', flag: '🇳🇬', seaBilling: 'Volume (CBM)', airBilling: 'Weight (kg)', clearingCurrency: 'NGN (₦)' },
    { country: 'Ghana', flag: '🇬🇭', seaBilling: 'Volume (CBM)', airBilling: 'Weight (kg)', clearingCurrency: 'GHS (GH₵)' },
    { country: 'United Kingdom', flag: '🇬🇧', seaBilling: 'Weight (kg)', airBilling: 'Weight (kg)', clearingCurrency: 'USD ($)' },
    { country: 'United States', flag: '🇺🇸', seaBilling: 'Weight (kg)', airBilling: 'Weight (kg)', clearingCurrency: 'USD ($)' },
    { country: 'Italy', flag: '🇮🇹', seaBilling: 'Weight (kg)', airBilling: 'Weight (kg)', clearingCurrency: 'USD ($)' },
  ];

  return (
    <div className="space-y-8">
      {/* Shipping Routes */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-surface-900">Shipping Routes (Origins)</h3>
          <p className="text-sm text-surface-500">Warehouse locations in China where packages are consolidated</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div key={route.name} className="bg-white rounded-2xl border border-surface-200/60 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <span className="text-lg">{route.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{route.label}</p>
                  <p className="text-xs text-surface-500">{route.city}</p>
                </div>
              </div>
              <p className="text-xs text-surface-500">{route.description}</p>
              <div className="mt-3 pt-3 border-t border-surface-100">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Destinations */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-surface-900">Delivery Destinations</h3>
          <p className="text-sm text-surface-500">Supported countries with their billing methods and clearing currencies</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Country</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Sea Billing</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Air Billing</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Clearing Currency</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((dest) => (
                <tr key={dest.country} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4">
                    <span className="text-sm font-medium text-surface-900">{dest.flag} {dest.country}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      dest.seaBilling.includes('Volume') ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {dest.seaBilling}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                      {dest.airBilling}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-surface-700">{dest.clearingCurrency}</td>
                  <td className="p-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════
// TRACKING CONFIG TAB
// ════════════════════════════════════════════════════════════════════

function TrackingTab() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedDest, setExpandedDest] = useState<string | null>(null);

  const DESTINATIONS = [
    { code: 'ALL', label: 'Common (All Destinations)', flag: '🌐' },
    { code: 'LAGOS_NIGERIA', label: 'Lagos, Nigeria', flag: '🇳🇬' },
    { code: 'ABUJA_NIGERIA', label: 'Abuja, Nigeria', flag: '🇳🇬' },
    { code: 'GHANA', label: 'Ghana', flag: '🇬🇭' },
    { code: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
    { code: 'USA', label: 'United States', flag: '🇺🇸' },
    { code: 'ITALY', label: 'Italy', flag: '🇮🇹' },
    { code: 'CANADA', label: 'Canada', flag: '🇨🇦' },
    { code: 'UAE', label: 'United Arab Emirates', flag: '🇦🇪' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([api.getTrackingStatuses(), api.getTrackingLocations()]);
      setStatuses(s);
      setLocations(l);
    } catch (err) {
      console.error('Failed to fetch tracking config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDeleteStatus(id: string) {
    if (!confirm('Delete this tracking status?')) return;
    try { await api.deleteTrackingStatus(id); await fetchData(); } catch (err: any) { alert(err.message); }
  }

  async function handleToggleStatus(item: any) {
    try { await api.updateTrackingStatus(item.id, { isActive: !item.isActive }); await fetchData(); } catch (err: any) { alert(err.message); }
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm('Delete this location?')) return;
    try { await api.deleteTrackingLocation(id); await fetchData(); } catch (err: any) { alert(err.message); }
  }

  async function handleToggleLocation(item: any) {
    try { await api.updateTrackingLocation(item.id, { isActive: !item.isActive }); await fetchData(); } catch (err: any) { alert(err.message); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tracking Statuses by Destination */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Tracking Statuses</h3>
            <p className="text-sm text-surface-500">Grouped by destination — click to expand</p>
          </div>
          <button onClick={() => setShowAddStatus(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all">
            <Plus size={14} /> Add Status
          </button>
        </div>

        <div className="space-y-3">
          {DESTINATIONS.map((dest) => {
            const destStatuses = statuses.filter((s) => s.destination === dest.code).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
            if (destStatuses.length === 0) return null;
            const isExpanded = expandedDest === dest.code;

            return (
              <div key={dest.code} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
                {/* Destination Header */}
                <button
                  onClick={() => setExpandedDest(isExpanded ? null : dest.code)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{dest.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-surface-900">{dest.label}</p>
                      <p className="text-xs text-surface-500">{destStatuses.length} status{destStatuses.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {destStatuses.slice(0, 5).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 border border-white" />
                      ))}
                      {destStatuses.length > 5 && <span className="text-xs text-surface-400 ml-2">+{destStatuses.length - 5}</span>}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
                  </div>
                </button>

                {/* Expanded Status List */}
                {isExpanded && (
                  <div className="border-t border-surface-100">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-100 bg-surface-50/50">
                          <th className="text-left p-3 pl-5 text-xs font-semibold text-surface-500 uppercase tracking-wider w-12">#</th>
                          <th className="text-left p-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Code</th>
                          <th className="text-left p-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Label</th>
                          <th className="text-left p-3 text-xs font-semibold text-surface-500 uppercase tracking-wider w-16">Active</th>
                          <th className="text-right p-3 pr-5 text-xs font-semibold text-surface-500 uppercase tracking-wider w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {destStatuses.map((s: any, idx: number) => (
                          <tr key={s.id} className="border-b border-surface-50 table-row-hover transition-colors">
                            <td className="p-3 pl-5 text-sm text-surface-400">{s.sortOrder}</td>
                            <td className="p-3">
                              <span className="font-mono text-xs px-2 py-1 rounded-lg bg-surface-50 text-surface-600">{s.code}</span>
                            </td>
                            <td className="p-3 text-sm text-surface-900">{s.label}</td>
                            <td className="p-3">
                              <button onClick={() => handleToggleStatus(s)}>
                                {s.isActive
                                  ? <ToggleRight size={20} className="text-emerald-500" />
                                  : <ToggleLeft size={20} className="text-surface-400" />
                                }
                              </button>
                            </td>
                            <td className="p-3 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setEditingStatus(s)} className="p-1.5 rounded-lg hover:bg-surface-50">
                                  <Pencil size={14} className="text-surface-400" />
                                </button>
                                <button onClick={() => handleDeleteStatus(s.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                                  <Trash2 size={14} className="text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking Locations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Tracking Locations</h3>
            <p className="text-sm text-surface-500">Locations used in tracking updates</p>
          </div>
          <button onClick={() => setShowAddLocation(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition-all">
            <Plus size={14} /> Add Location
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider w-12">#</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Code</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Label</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Country</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l: any) => (
                <tr key={l.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4 text-sm text-surface-400">{l.sortOrder}</td>
                  <td className="p-4"><span className="font-mono text-xs px-2 py-1 rounded-lg bg-surface-50 text-surface-600">{l.code}</span></td>
                  <td className="p-4 text-sm text-surface-900">{l.label}</td>
                  <td className="p-4 text-sm text-surface-500">{l.country || '—'}</td>
                  <td className="p-4">
                    <button onClick={() => handleToggleLocation(l)}>
                      {l.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-surface-400" />}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingLocation(l)} className="p-1.5 rounded-lg hover:bg-surface-50"><Pencil size={14} className="text-surface-400" /></button>
                      <button onClick={() => handleDeleteLocation(l.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(showAddStatus || editingStatus) && (
        <TrackingStatusModal
          status={editingStatus}
          onClose={() => { setShowAddStatus(false); setEditingStatus(null); }}
          onSaved={() => { setShowAddStatus(false); setEditingStatus(null); fetchData(); }}
        />
      )}
      {(showAddLocation || editingLocation) && (
        <TrackingLocationModal
          location={editingLocation}
          onClose={() => { setShowAddLocation(false); setEditingLocation(null); }}
          onSaved={() => { setShowAddLocation(false); setEditingLocation(null); fetchData(); }}
        />
      )}
    </div>
  );
}


function TrackingStatusModal({ status, onClose, onSaved }: { status?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!status;
  const [code, setCode] = useState(status?.code || '');
  const [label, setLabel] = useState(status?.label || '');
  const [description, setDescription] = useState(status?.description || '');
  const [destination, setDestination] = useState(status?.destination || 'ALL');
  const [sortOrder, setSortOrder] = useState(status?.sortOrder?.toString() || '0');
  const [loading, setLoading] = useState(false);

  const DEST_OPTIONS = [
    { value: 'ALL', label: 'Common (All Destinations)' },
    { value: 'LAGOS_NIGERIA', label: 'Lagos, Nigeria' },
    { value: 'ABUJA_NIGERIA', label: 'Abuja, Nigeria' },
    { value: 'GHANA', label: 'Ghana' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'USA', label: 'United States' },
    { value: 'ITALY', label: 'Italy' },
    { value: 'CANADA', label: 'Canada' },
    { value: 'UAE', label: 'UAE' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateTrackingStatus(status.id, { label, description: description || null, sortOrder: parseInt(sortOrder) });
      } else {
        await api.createTrackingStatus({ code: code.toUpperCase().replace(/\s+/g, '_'), label, description: description || undefined, sortOrder: parseInt(sortOrder), destination } as any);
      }
      onSaved();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">{isEdit ? 'Edit Status' : 'Add Tracking Status'}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Destination</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {DEST_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. NG_LAG_ARRIVED_MMA" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="e.g. Package Arrive M. Muhammed Airport" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function TrackingLocationModal({ location, onClose, onSaved }: { location?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!location;
  const [code, setCode] = useState(location?.code || '');
  const [label, setLabel] = useState(location?.label || '');
  const [country, setCountry] = useState(location?.country || '');
  const [sortOrder, setSortOrder] = useState(location?.sortOrder?.toString() || '0');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateTrackingLocation(location.id, { label, country: country || null, sortOrder: parseInt(sortOrder) });
      } else {
        await api.createTrackingLocation({ code: code.toUpperCase().replace(/\s+/g, '_'), label, country: country || undefined, sortOrder: parseInt(sortOrder) });
      }
      onSaved();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">{isEdit ? 'Edit Location' : 'Add Tracking Location'}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. LAGOS_AIRPORT" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="e.g. Murtala Muhammed Airport" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-all">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
