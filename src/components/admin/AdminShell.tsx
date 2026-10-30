'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/Sidebar';
import { TopNav } from '@/components/admin/TopNav';

interface AdminShellProps {
  children: React.ReactNode;
  initialRole?: string | null;
}

export function AdminShell({ children, initialRole }: AdminShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login' || pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-[#121417] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white transition-colors duration-300">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-[#121417] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex antialiased selection:bg-purple-500 selection:text-white">
      {/* Modern Floating Slim Sidebar */}
      <Sidebar initialRole={initialRole} />

      {/* Right Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pl-[98px] pr-4 sm:pr-8 py-5 min-h-screen">
        {/* Top Capsule Navigation */}
        <TopNav />

        {/* Page Content Viewport */}
        <main className="flex-1 w-full space-y-6 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
