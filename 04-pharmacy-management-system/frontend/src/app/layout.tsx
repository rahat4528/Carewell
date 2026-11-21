import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carewell Pharmacy Management System',
  description: 'Production dispensary, FEFO batch allocation, POS billing and controlled substance compliance system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
