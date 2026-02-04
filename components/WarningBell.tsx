import { useState, useEffect, useRef } from 'react';
import { Warning } from '@/types';
import { getWarnings } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WarningBell() {
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        fetchWarnings();
        // Poll every minute for new warnings
        const interval = setInterval(fetchWarnings, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchWarnings = async () => {
        try {
            const allWarnings = await getWarnings();
            // Filter for warnings created in the last 48 hours
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const freshWarnings = allWarnings.filter(w => new Date(w.createdAt) > fortyEightHoursAgo);
            setWarnings(freshWarnings);
        } catch (error) {
            console.error('Error fetching warnings for bell:', error);
        }
    };

    const hasWarnings = warnings.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <span className="sr-only">View notifications</span>
                {/* Bell Icon */}
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {/* Red Dot Badge */}
                {hasWarnings && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500" />
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900">{t('warning.recent_title')}</h3>
                        </div>
                        {warnings.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                {t('warning.no_warnings')}
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                {warnings.map((warning) => (
                                    <div key={warning.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {warning.foremanName || t('table.unknown_foreman')}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-1">
                                            {t('table.project')}: {warning.projectName || (warning.projectId ? warning.projectId.slice(0, 8) : '-')}
                                        </p>
                                        <p className="text-sm text-red-600">
                                            {warning.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(warning.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                            {/* Link to view all could go here if route existed, currently just info */}
                            <span className="text-xs text-gray-500">{t('warning.view_all')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
