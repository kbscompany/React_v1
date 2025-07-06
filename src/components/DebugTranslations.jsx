import React from 'react'
import { useTranslation } from 'react-i18next'

const DebugTranslations = () => {
  const { t, i18n } = useTranslation()

  const testKeys = [
    'common.cancel',
    'finance.issueChequeModal.title', 
    'finance.issueChequeModal.selectChequeNumber',
    'finance.issueChequeModal.searchSelectCheque'
  ]

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.body.classList.remove('ltr', 'rtl')
    document.body.classList.add(lang === 'ar' ? 'rtl' : 'ltr')
  }

  return (
    <div className="p-6 bg-gray-100 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔧 Debug Translations</h2>
      
      <div className="mb-4">
        <p><strong>Current Language:</strong> {i18n.language}</p>
        <p><strong>Ready:</strong> {i18n.isInitialized ? 'Yes' : 'No'}</p>
        <p><strong>Direction:</strong> {document.documentElement.dir}</p>
      </div>

      <div className="mb-4">
        <button 
          onClick={() => handleLanguageChange('en')} 
          className="mr-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          Switch to English
        </button>
        <button 
          onClick={() => handleLanguageChange('ar')} 
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Switch to Arabic
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Translation Test:</h3>
        {testKeys.map(key => (
          <div key={key} className="text-sm">
            <strong>{key}:</strong> {t(key)}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Available Languages:</h3>
        <p>{Object.keys(i18n.store.data).join(', ')}</p>
      </div>
    </div>
  )
}

export default DebugTranslations 