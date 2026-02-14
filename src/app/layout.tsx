import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Naiyuan Admin',
  description: 'Naiyuan Logistics Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-50 text-surface-900 antialiased">{children}</body>
    </html>
  );
}