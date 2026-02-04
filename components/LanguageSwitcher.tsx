'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => setLocale('en')}
                className={`px-2 py-1 text-sm rounded ${locale === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                EN
            </button>
            <button
                onClick={() => setLocale('ru')}
                className={`px-2 py-1 text-sm rounded ${locale === 'ru' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                RU
            </button>
            <button
                onClick={() => setLocale('uz')}
                className={`px-2 py-1 text-sm rounded ${locale === 'uz' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                UZ
            </button>
        </div>
    );
}
