import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', colors.bg, colors.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}