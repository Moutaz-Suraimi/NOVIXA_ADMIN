import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import DashboardLayoutWrapper from '@/components/DashboardLayoutWrapper';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'لوحة تحكم نوفيكسا | Novixa Admin Dashboard',
  description: 'نظام إدارة متكامل لتطبيق نوفيكسا التجاري - المنتجات، الأقسام، الطلبات، وطلبات الاحتياج',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="bg-[#08111F] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
        <DashboardLayoutWrapper>
          {children}
        </DashboardLayoutWrapper>
      </body>
    </html>
  );
}
