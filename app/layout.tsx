import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Boursa AI | Iranian Market Intelligence', description: 'تحلیل داده‌محور بازار سرمایه ایران و شبیه‌ساز معاملات' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fa" dir="rtl"><body>{children}</body></html>; }
