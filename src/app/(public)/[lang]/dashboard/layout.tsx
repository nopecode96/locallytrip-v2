import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const resolved = await params;
  const lang = resolved.lang || 'id';

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}
