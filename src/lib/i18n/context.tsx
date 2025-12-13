"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, languageNames } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof languageNames;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = "en" }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    // Check for stored preference
    const stored = localStorage.getItem("language") as Language;
    if (stored && translations[stored]) {
      setLanguageState(stored);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.split("-")[0] as Language;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{${param}}`, "g"), String(value));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: languageNames }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Hook for formatted dates based on language
export function useLocalizedDate() {
  const { language } = useI18n();

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const localeMap: Record<Language, string> = {
      en: "en-US",
      es: "es-ES",
      vi: "vi-VN",
      ko: "ko-KR",
      zh: "zh-CN",
    };

    return d.toLocaleDateString(localeMap[language], options);
  };

  const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const localeMap: Record<Language, string> = {
      en: "en-US",
      es: "es-ES",
      vi: "vi-VN",
      ko: "ko-KR",
      zh: "zh-CN",
    };

    return d.toLocaleTimeString(localeMap[language], {
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    });
  };

  const formatCurrency = (amount: number) => {
    const localeMap: Record<Language, string> = {
      en: "en-US",
      es: "es-ES",
      vi: "vi-VN",
      ko: "ko-KR",
      zh: "zh-CN",
    };

    return new Intl.NumberFormat(localeMap[language], {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return { formatDate, formatTime, formatCurrency };
}
