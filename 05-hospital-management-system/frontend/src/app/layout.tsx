import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carewell Hospital Management System',
  description: 'Enterprise EHR, Inpatient Bed Allocation, Laboratory 4-Eyes Review, and ReBAC Access Control.',
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
