import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

function Login({ onLogin }) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await onLogin(username, password, rememberMe)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#333',
          fontSize: '24px'
        }}>
          {t('navigation.dashboard')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#555',
              fontWeight: '500'
            }}>
              {t('auth.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder={t('auth.username')}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#555',
              fontWeight: '500'
            }}>
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder={t('auth.password')}
            />
          </div>
          
          {/* Remember Me */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="rememberMe" style={{ color: '#555', fontSize: '14px' }}>
              Remember me
            </label>
          </div>
          
          {error && (
            <div style={{
              color: '#dc3545',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <strong>{t('auth.demoCredentials')}</strong><br />
          {t('auth.demoUsername')}<br />
          {t('auth.demoPassword')}
        </div>
      </div>
    </div>
  )
}

export default Login 