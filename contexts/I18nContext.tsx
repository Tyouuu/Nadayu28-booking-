import React, { createContext, useContext, useState, useCallback } from 'react';
import { Locale, Translations } from '../i18n/types';
import { en } from '../i18n/en';
import { ms } from '../i18n/ms';
import { zh } from '../i18n/zh';

const translations: Record<Locale, Translations> = { en, ms, zh };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: '中文',
};

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getInitialLocale(): Locale {
  const saved = localStorage.getItem('nadayu28_locale') as Locale | null;
  if (saved && translations[saved]) return saved;
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('nadayu28_locale', newLocale);
  }, []);

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
