import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TailwindTest from './components/TailwindTest'
import LanguageSwitcher from './components/LanguageSwitcher'
import roleManager from './lib/roleManager'
import axios from 'axios'
import './i18n' // Initialize i18n
import './styles/rtl.css' // RTL support

// Set up axios defaults
axios.defaults.baseURL = 'http://localhost:8000'

function App() {
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/users/me')
      console.log('User info fetched:', response.data)
      const userData = response.data
      setUser(userData)
      
      // Initialize role manager with user data
      roleManager.setUser(userData)
      console.log('Role manager initialized with user role:', userData.role || 'admin')
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (username, password, rememberMe) => {
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)

      const response = await axios.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const { access_token } = response.data
      if (rememberMe) {
        localStorage.setItem('token', access_token)
        localStorage.setItem('username', username)
        localStorage.setItem('password', password)
      } else {
        sessionStorage.setItem('token', access_token)
        sessionStorage.setItem('username', username)
        sessionStorage.setItem('password', password)
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      await fetchUserInfo()
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('password')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('password')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    
    // Clear role manager
    roleManager.setUser(null)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        {t('common.loading')}
      </div>
    )
  }

  console.log('App render - user:', user, 'loading:', loading)
  
  return (
    <div style={{ minHeight: '100vh' }}>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App 