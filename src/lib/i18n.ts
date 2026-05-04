import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import he from '@/locales/he.json';
import en from '@/locales/en.json';

const deviceLocale = (() => {
  try {
    const locales = getLocales();
    return locales[0]?.languageCode ?? 'he';
  } catch {
    return 'he';
  }
})();

const supported = ['he', 'en'] as const;
const initialLng = supported.includes(deviceLocale as (typeof supported)[number])
  ? deviceLocale
  : 'he';

void i18n.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;
