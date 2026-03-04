import { createContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from './translations';

export const I18nContext = createContext(null);

function detectLocale() {
  const lang = navigator.language?.split('-')[0] || 'en';
  return translations[lang] ? lang : 'en';
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useLocalStorage('watch10-locale', detectLocale());

  const t = useCallback((key, params) => {
    let str = translations[locale]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  }, [locale]);

  const value = useMemo(() => ({
    t,
    locale,
    setLocale,
    availableLocales: Object.keys(translations),
  }), [t, locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
