import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/shared/i18n/locales/en/common.json'
import frCommon from '@/shared/i18n/locales/fr/common.json'

void i18n.use(initReactI18next).init({
  lng: 'fr',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    fr: {
      common: frCommon,
    },
    en: {
      common: enCommon,
    },
  },
  defaultNS: 'common',
  ns: ['common'],
})

export default i18n
