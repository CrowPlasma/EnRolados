'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { es } from './locales/es';
import { en } from './locales/en';

type Language = 'es' | 'en';
type Dictionary = typeof es;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries = {
  es,
  en
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('enrolados-lang') as Language;
    if (storedLang && (storedLang === 'es' || storedLang === 'en')) {
      setLanguageState(storedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('enrolados-lang', lang);
  };

  // To prevent hydration mismatch, we don't render children until mounted
  // or we render them but we know the first render on client will match server (es)
  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {!mounted ? (
        <div style={{ visibility: 'hidden' }}>{children}</div>
      ) : (
        children
      )}
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
