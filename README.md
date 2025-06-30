# Warehouse Management System 🧁

A complete warehouse management system built with FastAPI (backend) and React/TypeScript (frontend), designed for a dessert shop with multi-language support (English/Arabic).

## 🚀 Features

### Backend (FastAPI)
- ✅ Complete CRUD operations for items, packages, sub-recipes, mid-prep recipes, and cakes
- ✅ JWT Authentication system
- ✅ Multi-warehouse support
- ✅ Stock management with movement tracking
- ✅ Excel import/export functionality
- ✅ Waste management system
- ✅ RESTful API with automatic documentation

### Frontend (React/TypeScript)
- ✅ Modern UI with Material-UI and Tailwind CSS
- ✅ Multi-language support (English/Arabic)
- ✅ Item management with package tracking
- ✅ Sub-recipe management with cost calculations
- ✅ Mid-prep recipe creation
- ✅ Responsive dessert-themed design (pink & brown color scheme)

## 📁 Project Structure

```
FastAPI test/
├── backend files (main.py, models.py, schemas.py, etc.)
├── fastapi-warehouse-management/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   └── i18n/
│       ├── package.json
│       └── vite.config.ts
├── start_app.ps1         # PowerShell startup script
├── start_app.bat         # Batch file startup script
└── test_complete_api.py  # API testing script
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure MySQL Database:**
   - Ensure MySQL is running on `localhost:3306`
   - The app expects database: `bakery_db`
   - User: `bakery_user` with password: `[Set in .env file]`
   - If using different credentials, update `config.py`

3. **Create database tables:**
   The application will automatically create tables on startup.

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd fastapi-warehouse-management/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 🚀 Running the Application

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\start_app.ps1
```

### Option 2: Using Batch File
```cmd
start_app.bat
```

### Option 3: Manual Start

**Backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd fastapi-warehouse-management/frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 🔑 Default Credentials

- Username: `admin`
- Password: `Kbs878$`

## 🧪 Testing

Run the API test script:
```bash
python test_complete_api.py
```

## 📊 Database Schema

The system uses the following main tables:
- `users` - User authentication
- `items` - Inventory items
- `ingredient_packages` - Package definitions
- `warehouses` - Warehouse locations
- `warehouse_stock` - Stock levels
- `stock_movements` - Stock change history
- `sub_recipes` - Sub-recipe definitions
- `mid_prep_recipes` - Mid-preparation recipes
- `cakes` - Cake recipes
- `waste_logs` - Waste tracking

## 🐛 Known Issues

1. **MySQL Connection**: If you see connection errors, ensure:
   - MySQL service is running
   - Database `bakery_db` exists
   - User credentials are correct in `config.py`

2. **Port 8000 in use**: Kill existing process:
   ```powershell
   # Find process
   netstat -ano | findstr :8000
   # Kill process (replace PID)
   taskkill /F /PID <PID>
   ```

3. **Module import errors**: Ensure all dependencies are installed:
   ```bash
   pip install fastapi uvicorn sqlalchemy mysql-connector-python pydantic-settings python-jose passlib pandas openpyxl python-multipart
   ```

## 🎨 UI Features

- **Dessert Shop Theme**: Pink (#E91E63) and Brown (#8D6E63) color scheme
- **Responsive Design**: Works on desktop and mobile
- **Multi-language**: Switch between English and Arabic
- **Modern Components**: Using Shadcn UI and Material-UI

## 📝 Implementation Status

### ✅ Completed
- User authentication system
- Complete item management with packages
- Sub-recipe management with cost calculations
- Mid-prep recipe creation
- Multi-language support (EN/AR)
- Responsive UI design

### 🚧 Pending
- Cake recipe full implementation
- Stock movement reporting
- Waste approval workflow
- Dashboard analytics

## 🤝 Contributing

This is a private project for a dessert shop warehouse management system. 