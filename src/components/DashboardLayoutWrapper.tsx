'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import RealtimeAlerts from '@/components/RealtimeAlerts';
import { supabase } from '@/lib/supabase';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track inactivity if we are NOT on the login page
    if (pathname === '/login') return;

    const logoutUser = async () => {
      await supabase.auth.signOut();
      router.push('/login?reason=timeout');
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 15 minutes timeout (15 * 60 * 1000 = 900000 ms)
      timeoutRef.current = setTimeout(logoutUser, 900000);
    };

    // Listen to user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Initialize on mount

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [pathname, router]);

  // If we are on the login page, just render the content without Sidebar/TopHeader
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Otherwise, render the full admin dashboard layout
  return (
    <>
      <RealtimeAlerts />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-b from-[#08111F] via-[#0A1628] to-[#08111F]">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
