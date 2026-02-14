'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(email, otp);
      if (res.accessToken) {
        api.setToken(res.accessToken);
        window.location.href = '/';
      } else {
        setError('Login failed — no token received');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-400 flex items-center justify-center">
              <span className="text-surface-950 font-bold text-lg">N</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Naiyuan</span>
          </div>
          <p className="text-surface-400 text-sm">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8">
          <h2 className="text-xl font-semibold text-surface-900 mb-1">
            {step === 'email' ? 'Sign in' : 'Enter verification code'}
          </h2>
          <p className="text-surface-500 text-sm mb-6">
            {step === 'email'
              ? 'Enter your admin email to receive a login code'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@naiyuan.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-surface-900 text-white font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 text-center text-2xl font-mono tracking-[0.5em] placeholder:text-surface-400 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-surface-900 text-white font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full mt-2 px-4 py-2 text-sm text-surface-500 hover:text-surface-700 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-surface-500 text-xs mt-6">
          Naiyuan Logistics © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}