'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Expense } from '@/types';
import { getExpenses } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ITEMS = 15;

export default function ExpenseBell() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchExpenses();
    const interval = setInterval(fetchExpenses, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentExpenses = useMemo(() => {
    const threshold = Date.now() - RECENT_WINDOW_MS;
    return expenses
      .filter((exp) => {
        const created = exp.createdAt instanceof Date ? exp.createdAt.getTime() : new Date(exp.createdAt).getTime();
        return created >= threshold;
      })
      .slice(0, MAX_ITEMS);
  }, [expenses]);

  const hasRecent = recentExpenses.length > 0;

  const fetchExpenses = async () => {
    try {
      const allExpenses = await getExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Failed to fetch expenses for notifications:', error);
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount && amount !== 0) return '-';
    return `${amount.toLocaleString('uz-UZ')} UZS`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <span className="sr-only">View expense notifications</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1 4h.01M12 8h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
          />
        </svg>
        {hasRecent && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500" />}
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{t('expense.notifications.title') || 'Recent expenses'}</h3>
              <p className="text-xs text-gray-500">
                {t('expense.notifications.subtitle') || 'Last 24 hours'}
              </p>
            </div>
            {!hasRecent ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {t('expense.notifications.no_recent') || 'No recent expenses'}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900 truncate">{exp.name || '-'}</p>
                    <p className="text-xs text-gray-500">
                      {formatAmount(exp.amount)} • {exp.categoryName || '-'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('expense.notifications.created_by') || 'Created by'}: {exp.createdByName || '-'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(exp.createdAt instanceof Date ? exp.createdAt : new Date(exp.createdAt)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

