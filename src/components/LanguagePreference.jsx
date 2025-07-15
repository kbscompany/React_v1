import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const LanguagePreference = ({ user, onLanguageChange }) => {
  const { t, i18n } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleLanguageChange = async (newLanguage) => {
    if (!user || updating) return;
    
    setUpdating(true);
    setMessage('');
    
    try {
      // Update user preference in backend
      await api.put(`/admin-simple/users/${user.id}`, {
        preferred_language: newLanguage
      });
      
      // Change current language
      i18n.changeLanguage(newLanguage);
      
      // Update local storage
      localStorage.setItem('preferred_language', newLanguage);
      
      // Show success message
      setMessage(t('settings.languageUpdated'));
      setTimeout(() => setMessage(''), 3000);
      
      // Callback to parent component
      if (onLanguageChange) {
        onLanguageChange(newLanguage);
      }
      
      console.log('🌐 Language preference updated:', newLanguage);
    } catch (error) {
      console.error('Error updating language preference:', error);
      setMessage('Error updating language preference');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {t('settings.language')}:
        </span>
        <select
          value={user?.preferred_language || 'en'}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={updating}
          style={{
            padding: '0.25rem 0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: updating ? '#f5f5f5' : 'white',
            cursor: updating ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="en">🇺🇸 English</option>
          <option value="ar">🇸🇦 العربية</option>
        </select>
        {updating && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            Updating...
          </span>
        )}
      </div>
      {message && (
        <div style={{
          fontSize: '12px',
          color: message.includes('Error') ? '#dc3545' : '#28a745',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LanguagePreference; 