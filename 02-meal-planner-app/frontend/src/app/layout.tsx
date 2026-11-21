import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carewell Meal Planner App',
  description: 'Household recipe organization, weekly meal planning, and smart grocery logistics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
