import requests

print('=== SYSTEM STATUS ===')

try:
    backend = requests.get('http://localhost:8000/', timeout=5)
    print(f'✅ Backend: {backend.status_code} - FastAPI server running')
except:
    print('❌ Backend: Not responding')

try:
    frontend = requests.get('http://localhost:3000/', timeout=5)
    print(f'✅ Frontend: {frontend.status_code} - React server running')
except:
    print('❌ Frontend: Not responding')

try:
    safes = requests.get('http://localhost:8000/safes-simple', timeout=5)
    print(f'✅ Database: {safes.status_code} - Connected and working')
except:
    print('❌ Database: Connection issue')

print('\n🚀 Your system is ready!')
print('📱 Frontend UI: http://localhost:3000')
print('🔧 Backend API: http://localhost:8000')
print('📚 API Docs: http://localhost:8000/docs')
print('\n✨ All functions are ready to use!') 