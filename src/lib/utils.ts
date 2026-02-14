import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  EN_ROUTE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ARRIVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  IN_SHIPMENT: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  DELIVERED: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  REQUESTED: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  PROCESSING: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  IN_TRANSIT: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  OUT_FOR_DELIVERY: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  OVERDUE: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};