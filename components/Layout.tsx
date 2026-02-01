'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, subscribeToAuthChanges } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { User } from '@/types';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const WarningBell = dynamic(() => import('./WarningBell'), { ssr: false });

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Escape hatch for strict typed i18n keys (prevents build failures)
  const tt = (key: string, fallback?: string) => {
    const value = (t as unknown as (k: string) => string)(key);
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return fallback ?? key;
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);

      const isPublicRoute = pathname === '/login' || pathname.startsWith('/secret');

      if (!currentUser && !isPublicRoute) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">{tt('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { name: tt('nav.dashboard', 'Dashboard'), href: `/dashboard/${user.role}` },
    { name: tt('nav.attendance', 'Attendance'), href: '/dashboard/attendance' },
    { name: tt('nav.calendar', 'Calendar'), href: '/dashboard/calendar' },
    { name: tt('nav.meetings', 'Meetings'), href: '/dashboard/meetings' },
    { name: tt('nav.statistics', 'Statistics'), href: '/dashboard/statistics' },

    // Only show accounting link for HR, Admin, and Director
    ...(['hr', 'admin', 'director'].includes(user.role)
      ? [{ name: tt('nav.accounting', 'Accounting'), href: '/dashboard/accounting' }]
      : []),

    // Only show finance link for HR, Admin, and Director
    ...(['hr', 'admin', 'director'].includes(user.role)
      ? [{ name: tt('nav.finance', 'Finance'), href: '/dashboard/finance' }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
          lg:static lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white tracking-wider">
              {tt('app.title', 'App')}
            </h1>

            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.name}
                </a>
              );
            })}
          </div>

          {/* User Profile / Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0)?.toUpperCase?.() || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {tt(`role.${user.role}`, user.role)}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              {tt('signout', 'Sign out')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Top Header */}
        <header className="flex items-center justify-between lg:justify-end h-16 px-4 lg:px-8 bg-white border-b border-gray-200">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <WarningBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
