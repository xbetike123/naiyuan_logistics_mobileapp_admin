'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Search, Users as UsersIcon } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  accountType: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  _count: { packages: number; shipments: number; bills: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    api.getUsers(search || undefined).then(setUsers).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users</h1>
          <p className="text-surface-500 mt-1">{users.length} registered users</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200/60 p-4 mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-surface-400">
            <UsersIcon size={32} className="mb-2" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Role</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Packages</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Shipments</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Bills</th>
                <th className="text-left p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-surface-50 table-row-hover transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-surface-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-surface-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-100 text-surface-600">
                      {user.accountType}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.role === 'ADMIN' ? 'bg-brand-50 text-brand-700' : 'bg-surface-100 text-surface-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-surface-600">{user._count.packages}</td>
                  <td className="p-4 text-sm text-surface-600">{user._count.shipments}</td>
                  <td className="p-4 text-sm text-surface-600">{user._count.bills}</td>
                  <td className="p-4 text-sm text-surface-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}