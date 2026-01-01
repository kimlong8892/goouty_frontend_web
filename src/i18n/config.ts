import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

const resources = {
    en: {
        translation: en
    },
    vi: {
        translation: vi
    }
};

i18n
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
        resources,
        lng: 'vi', // Always use Vietnamese
        fallbackLng: 'vi', // Fallback to Vietnamese
        debug: false,

        interpolation: {
            escapeValue: false // React already escapes values
        }
    });

export default i18n;
