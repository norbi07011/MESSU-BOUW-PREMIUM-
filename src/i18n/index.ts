import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './pl';
import nl from './nl';
import en from './en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl,
      nl,
      en,
    },
    lng: localStorage.getItem('language') || 'pl',
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
