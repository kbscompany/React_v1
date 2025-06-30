import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api/purchase-orders': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/api/supplier-payment-cheques': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/safes': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/categories': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/expenses': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/cheques': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/bank-accounts': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/items': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/early-settlements': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/files': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/expense-categories': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/safes-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/cheques-unassigned-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/bank-accounts-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/categories-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/expense-categories-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/expense-categories-tree-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/items-manage': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/items-statistics': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/sub-recipes-manage': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/cakes-manage': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/mid-prep-recipes-manage': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/items-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/sub-recipes-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/mid-prep-recipes-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/cakes-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/early-settlements-simple': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/fresh': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
}) 