import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations
  },
  ar: {
    translation: arTranslations
  }
};

console.log('🌐 Initializing i18n...');
console.log('📚 English translations loaded:', Object.keys(enTranslations).length > 0);
console.log('📚 Arabic translations loaded:', Object.keys(arTranslations).length > 0);
console.log('🔧 Arabic finance exists:', !!(arTranslations as any).finance);
console.log('🔧 Arabic finance.issueChequeModal exists:', !!((arTranslations as any).finance?.issueChequeModal));

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: true,
    
    // Add explicit namespace support
    defaultNS: 'translation',
    ns: ['translation'],

    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    // Force fresh load to bypass cache
    load: 'languageOnly',
    cleanCode: true,
    nonExplicitSupportedLngs: true,
    
    // Add more detailed debug info
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`🚨 Missing translation: ${lng}.${ns}.${key}`);
    }
  });

// Debug: Log available languages after initialization
i18n.on('initialized', () => {
  console.log('✅ i18n initialized');
  console.log('🗣️ Available languages:', Object.keys(i18n.store.data));
  console.log('🌐 Current language:', i18n.language);
  
  // Test a specific translation key
  const testKey = 'finance.issueChequeModal.title';
  console.log(`🧪 Test translation (${testKey}):`, i18n.t(testKey));
});

// Debug: Log language changes
i18n.on('languageChanged', (lng) => {
  console.log(`🔄 Language changed to: ${lng}`);
  const testKey = 'finance.issueChequeModal.title';
  console.log(`🧪 Test translation after change (${testKey}):`, i18n.t(testKey));
});

export default i18n; 