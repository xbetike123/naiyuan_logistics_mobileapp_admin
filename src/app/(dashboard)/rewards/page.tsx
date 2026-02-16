'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  RefreshCw,
  Gift,
  Users,
  Trophy,
  Wallet,
  Settings,
  Search,
  ChevronDown,
  Plus,
  Minus,
  X,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: string;
  rewardAmount: number;
  rewardedAt: string | null;
  createdAt: string;
  referrer: { id: string; email: string; firstName: string; lastName: string };
  referee: { id: string; email: string; firstName: string; lastName: string };
}

interface LoyaltyTier {
  id: string;
  name: string;
  label: string;
  minShipments: number;
  perks: {
    description: string;
    freightDiscount: number;
    freePacking: boolean;
    priorityProcessing: boolean;
  };
  sortOrder: number;
  isActive: boolean;
}

interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  user: { id: string; email: string; firstName: string; lastName: string };
}

interface ReferralConfig {
  id: string;
  referrerRewardNGN: number;
  refereeRewardNGN: number;
  expiryDays: number;
  isActive: boolean;
}

const TIER_EMOJIS: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
};

const REFERRAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  QUALIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
  REWARDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-surface-100 text-surface-500 border-surface-200',
};

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════

export default function RewardsPage() {
  const [tab, setTab] = useState<'referrals' | 'tiers' | 'wallets' | 'config'>('referrals');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletSearch, setWalletSearch] = useState('');
  const [walletSearchInput, setWalletSearchInput] = useState('');
  const [walletModal, setWalletModal] = useState<{ wallet: UserWallet; action: 'credit' | 'debit' } | null>(null);
  const [tierModal, setTierModal] = useState<LoyaltyTier | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // FETCH
  // ═══════════════════════════════════════════════════════════════

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllReferrals();
      setReferrals(data);
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLoyaltyTiers();
      setTiers(data);
    } catch (err) {
      console.error('Failed to fetch tiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllWallets(walletSearch || undefined);
      setWallets(data);
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    } finally {
      setLoading(false);
    }
  }, [walletSearch]);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReferralConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'referrals') fetchReferrals();
    else if (tab === 'tiers') fetchTiers();
    else if (tab === 'wallets') fetchWallets();
    else if (tab === 'config') fetchConfig();
  }, [tab, fetchReferrals, fetchTiers, fetchWallets, fetchConfig]);

  useEffect(() => {
    const timer = setTimeout(() => setWalletSearch(walletSearchInput), 400);
    return () => clearTimeout(timer);
  }, [walletSearchInput]);

  function handleRefresh() {
    if (tab === 'referrals') fetchReferrals();
    else if (tab === 'tiers') fetchTiers();
    else if (tab === 'wallets') fetchWallets();
    else if (tab === 'config') fetchConfig();
  }

  // Stats
  const totalReferrals = referrals.length;
  const rewardedCount = referrals.filter((r) => r.status === 'REWARDED').length;
  const pendingCount = referrals.filter((r) => r.status === 'PENDING').length;
  const totalPaid = referrals.reduce((sum, r) => sum + (r.status === 'REWARDED' ? r.rewardAmount * 2 : 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Rewards Program</h1>
          <p className="text-surface-500 mt-1">Manage referrals, loyalty tiers, and wallets</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-100 rounded-xl p-1 w-fit">
        {[
          { key: 'referrals', label: 'Referrals', icon: Gift },
          { key: 'tiers', label: 'Loyalty Tiers', icon: Trophy },
          { key: 'wallets', label: 'Wallets', icon: Wallet },
          { key: 'config', label: 'Settings', icon: Settings },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REFERRALS TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 'referrals' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Referrals" value={totalReferrals} icon={Users} color="blue" />
            <StatCard label="Pending" value={pendingCount} icon={Clock} color="amber" />
            <StatCard label="Rewarded" value={rewardedCount} icon={CheckCircle} color="emerald" />
            <StatCard label="Total Paid" value={`₦${totalPaid.toLocaleString()}`} icon={Wallet} color="purple" />
          </div>

          <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : referrals.length === 0 ? (
              <EmptyState icon={Gift} text="No referrals yet" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Referrer</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Referee</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Reward</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-surface-900">
                          {ref.referrer.firstName} {ref.referrer.lastName}
                        </p>
                        <p className="text-xs text-surface-500">{ref.referrer.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-surface-900">
                          {ref.referee.firstName} {ref.referee.lastName}
                        </p>
                        <p className="text-xs text-surface-500">{ref.referee.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${REFERRAL_STATUS_COLORS[ref.status] || ''}`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {ref.status === 'REWARDED' ? (
                          <span className="text-sm font-semibold text-emerald-600">
                            ₦{ref.rewardAmount.toLocaleString()} each
                          </span>
                        ) : (
                          <span className="text-sm text-surface-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-surface-500">{formatDate(ref.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* LOYALTY TIERS TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 'tiers' && (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="p-5 rounded-xl border border-surface-200 hover:border-surface-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{TIER_EMOJIS[tier.name] || '⭐'}</span>
                      <div>
                        <h3 className="text-lg font-bold text-surface-900">{tier.label}</h3>
                        <p className="text-sm text-surface-500">{tier.minShipments}+ shipments</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTierModal(tier)}
                      className="px-3 py-1.5 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium hover:bg-surface-200 transition-all"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 mt-4">
                    <PerkRow
                      label="Freight Discount"
                      value={tier.perks.freightDiscount > 0 ? `${tier.perks.freightDiscount}%` : 'None'}
                      active={tier.perks.freightDiscount > 0}
                    />
                    <PerkRow label="Free Packing" value={tier.perks.freePacking ? 'Yes' : 'No'} active={tier.perks.freePacking} />
                    <PerkRow
                      label="Priority Processing"
                      value={tier.perks.priorityProcessing ? 'Yes' : 'No'}
                      active={tier.perks.priorityProcessing}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* WALLETS TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 'wallets' && (
        <>
          <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={walletSearchInput}
                onChange={(e) => setWalletSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : wallets.length === 0 ? (
              <EmptyState icon={Wallet} text="No wallets found" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Balance</th>
                    <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-surface-900">
                          {w.user.firstName} {w.user.lastName}
                        </p>
                        <p className="text-xs text-surface-500">{w.user.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${w.balance > 0 ? 'text-emerald-600' : 'text-surface-500'}`}>
                          ₦{w.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setWalletModal({ wallet: w, action: 'credit' })}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-all"
                          >
                            <Plus size={13} /> Credit
                          </button>
                          <button
                            onClick={() => setWalletModal({ wallet: w, action: 'debit' })}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-all"
                          >
                            <Minus size={13} /> Debit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CONFIG TAB */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === 'config' && (
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6 max-w-lg">
          {loading ? (
            <LoadingSpinner />
          ) : config ? (
            <ConfigForm config={config} onSaved={fetchConfig} />
          ) : (
            <EmptyState icon={Settings} text="No config found" />
          )}
        </div>
      )}

      {/* Modals */}
      {walletModal && (
        <WalletActionModal
          wallet={walletModal.wallet}
          action={walletModal.action}
          onClose={() => setWalletModal(null)}
          onDone={() => { setWalletModal(null); fetchWallets(); }}
        />
      )}

      {tierModal && (
        <EditTierModal
          tier={tierModal}
          onClose={() => setTierModal(null)}
          onSaved={() => { setTierModal(null); fetchTiers(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ════════════════════════════════════════════════════════════════════

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200/60 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          <p className="text-xs text-surface-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function PerkRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-surface-600">{label}</span>
      <span className={`text-sm font-medium ${active ? 'text-emerald-600' : 'text-surface-400'}`}>
        {value}
      </span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-surface-400">
      <Icon size={32} className="mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CONFIG FORM
// ════════════════════════════════════════════════════════════════════

function ConfigForm({ config, onSaved }: { config: ReferralConfig; onSaved: () => void }) {
  const [referrerReward, setReferrerReward] = useState(config.referrerRewardNGN);
  const [refereeReward, setRefereeReward] = useState(config.refereeRewardNGN);
  const [expiryDays, setExpiryDays] = useState(config.expiryDays);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.updateReferralConfig({
        referrerRewardNGN: referrerReward,
        refereeRewardNGN: refereeReward,
        expiryDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-surface-900">Referral Program Settings</h3>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">Referrer Reward (₦)</label>
        <input
          type="number"
          value={referrerReward}
          onChange={(e) => setReferrerReward(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-surface-400 mt-1">Amount credited to the person who refers</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">Referee Reward (₦)</label>
        <input
          type="number"
          value={refereeReward}
          onChange={(e) => setRefereeReward(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-surface-400 mt-1">Welcome bonus for the new user</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">Expiry (days)</label>
        <input
          type="number"
          value={expiryDays}
          onChange={(e) => setExpiryDays(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-surface-400 mt-1">Days before an unused referral expires</p>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
      >
        {saved ? (
          <>
            <CheckCircle size={16} /> Saved!
          </>
        ) : loading ? (
          'Saving...'
        ) : (
          <>
            <Save size={16} /> Save Settings
          </>
        )}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// WALLET ACTION MODAL
// ════════════════════════════════════════════════════════════════════

function WalletActionModal({
  wallet,
  action,
  onClose,
  onDone,
}: {
  wallet: UserWallet;
  action: 'credit' | 'debit';
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Enter a valid amount');
      return;
    }
    if (!description.trim()) {
      alert('Enter a description');
      return;
    }

    setLoading(true);
    try {
      if (action === 'credit') {
        await api.creditWallet(wallet.userId, { amount: numAmount, description });
      } else {
        await api.debitWallet(wallet.userId, { amount: numAmount, description });
      }
      onDone();
    } catch (err: any) {
      alert(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">
            {action === 'credit' ? 'Credit' : 'Debit'} Wallet
          </h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
            <p className="text-sm font-medium">{wallet.user.firstName} {wallet.user.lastName}</p>
            <p className="text-xs text-surface-500">{wallet.user.email}</p>
            <p className="text-sm font-bold mt-1">Current: ₦{wallet.balance.toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={action === 'credit' ? 'e.g. Promotional credit' : 'e.g. Refund reversal'}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all ${
              action === 'credit'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading
              ? 'Processing...'
              : action === 'credit'
              ? `Credit ₦${Number(amount || 0).toLocaleString()}`
              : `Debit ₦${Number(amount || 0).toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EDIT TIER MODAL
// ════════════════════════════════════════════════════════════════════

function EditTierModal({
  tier,
  onClose,
  onSaved,
}: {
  tier: LoyaltyTier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [minShipments, setMinShipments] = useState(tier.minShipments);
  const [freightDiscount, setFreightDiscount] = useState(tier.perks.freightDiscount);
  const [freePacking, setFreePacking] = useState(tier.perks.freePacking);
  const [priorityProcessing, setPriorityProcessing] = useState(tier.perks.priorityProcessing);
  const [description, setDescription] = useState(tier.perks.description);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await api.updateLoyaltyTier(tier.id, {
        minShipments,
        perks: {
          description,
          freightDiscount,
          freePacking,
          priorityProcessing,
        },
      });
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <h3 className="text-lg font-semibold text-surface-900">
            Edit {tier.label} Tier {TIER_EMOJIS[tier.name]}
          </h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Minimum Shipments</label>
            <input
              type="number"
              value={minShipments}
              onChange={(e) => setMinShipments(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Freight Discount (%)</label>
            <input
              type="number"
              value={freightDiscount}
              onChange={(e) => setFreightDiscount(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-surface-700">Free Packing</span>
            <button
              onClick={() => setFreePacking(!freePacking)}
              className={`w-10 h-6 rounded-full transition-all ${freePacking ? 'bg-emerald-500' : 'bg-surface-300'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${
                  freePacking ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-surface-700">Priority Processing</span>
            <button
              onClick={() => setPriorityProcessing(!priorityProcessing)}
              className={`w-10 h-6 rounded-full transition-all ${priorityProcessing ? 'bg-emerald-500' : 'bg-surface-300'}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${
                  priorityProcessing ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-400 text-surface-950 text-sm font-medium hover:bg-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}