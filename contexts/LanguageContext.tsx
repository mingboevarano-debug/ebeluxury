'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Locale } from '@/lib/i18n/dictionaries';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: keyof typeof dictionaries['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>(() => {
        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
            const savedLocale = localStorage.getItem('locale') as Locale;
            if (savedLocale && ['en', 'ru', 'uz'].includes(savedLocale)) {
                return savedLocale;
            }
        }
        return 'uz'; // Default to Uzbek
    });

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('locale', newLocale);
    };

    const t = (key: keyof typeof dictionaries['en']): string => {
        const translation = dictionaries[locale][key as keyof typeof dictionaries[typeof locale]];
        if (translation) return translation;

        const fallback = dictionaries['en'][key];
        if (fallback) return fallback;

        return key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
