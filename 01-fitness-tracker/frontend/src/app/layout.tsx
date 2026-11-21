import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carewell Fitness Tracker',
  description: 'Personal wellness and workout progressive overload monitoring platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
