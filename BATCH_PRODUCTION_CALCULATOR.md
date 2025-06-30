# 🧮 Batch Production Calculator

A comprehensive batch production calculator for calculating ingredients and costs for multiple cake production batches.

## 📋 Features

### Core Functionality
- **🔍 Smart Search Interface**: Search for cakes using a responsive search bar with autocomplete
- **⚡ Quick Add**: Press Enter to quickly add cakes to your batch
- **📊 Batch Calculation**: Calculate total ingredients, costs, and sub-recipe requirements
- **💾 Session Management**: Save, load, and manage calculation sessions
- **🧪 Sub-Recipe Analysis**: Detailed breakdown of sub-recipe usage and costs

### User Experience
- **🎨 Modern UI**: Clean, responsive interface built with Tailwind CSS
- **📱 Mobile-Friendly**: Works seamlessly on desktop and mobile devices  
- **🌐 Internationalization**: Full i18n support for multiple languages
- **⚠️ Smart Validation**: Requires minimum 2 cakes for batch calculations
- **💡 Helpful Tips**: Contextual guidance throughout the interface

## 🏗️ Technical Architecture

### Backend (FastAPI)
- **🔌 RESTful API**: Clean API endpoints for all operations
- **🛡️ Authentication**: Integrated with existing user authentication system
- **📂 Session Storage**: Database-backed session persistence
- **🔄 Recursive Calculations**: Handles complex sub-recipe hierarchies
- **💰 Cost Analysis**: Accurate cost calculations including nested recipes

### Frontend (React + Vite)
- **⚛️ React Components**: Modular, reusable component architecture
- **🎯 State Management**: Efficient local state with React hooks
- **🔄 Real-time Updates**: Live search and instant calculations
- **📱 Responsive Design**: Mobile-first responsive layout
- **🎨 Tailwind CSS**: Utility-first CSS framework

### Database Schema
```sql
-- Batch Sessions
CREATE TABLE batch_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    description TEXT,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    UNIQUE KEY unique_session_name_per_user (session_name, created_by)
);

-- Batch Session Items
CREATE TABLE batch_session_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL REFERENCES batch_sessions(id) ON DELETE CASCADE,
    cake_id INT NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
    quantity DECIMAL(10,5) NOT NULL
);
```

## 🔧 API Endpoints

### Cake Search
```http
GET /api/batch/cakes/search?q={query}&limit={limit}
```
Search for cakes with autocomplete functionality.

### Batch Calculation
```http
POST /api/batch/calculate
Content-Type: application/json

{
  "cake_quantities": {
    "1": 5.0,
    "2": 3.0
  }
}
```

### Session Management
```http
# Get all sessions
GET /api/batch/sessions

# Save session
POST /api/batch/sessions
{
  "session_name": "Birthday Batch",
  "description": "Special birthday order",
  "cake_quantities": {...},
  "total_cost": 150.00
}

# Load specific session
GET /api/batch/sessions/{session_id}

# Delete session
DELETE /api/batch/sessions/{session_id}
```

## 🎯 How to Use

### 1. Access the Calculator
- Log into the application
- Navigate to the "🧮 Batch Calculator" tab

### 2. Add Cakes
- Use the search bar to find cakes
- Press Enter to quickly add the first result
- Or click on any cake from the dropdown

### 3. Set Quantities
- Adjust quantities for each cake using the number inputs
- Remove cakes by clicking the trash icon
- Add at least 2 different cakes for batch calculation

### 4. Calculate Batch
- Click "🧮 Calculate Batch" to run the calculation
- View detailed ingredient breakdown and costs
- See sub-recipe usage summary

### 5. Save Session (Optional)
- Click "💾 Save Session" after calculation
- Provide a name and optional description
- Access saved sessions anytime via "📂 Sessions"

## 📊 Calculation Logic

### Ingredient Resolution
1. **Direct Ingredients**: Ingredients directly used in cakes
2. **Sub-Recipe Expansion**: Recursively resolves nested sub-recipes
3. **Cost Calculation**: Multiplies quantities by unit prices
4. **Aggregation**: Combines duplicate ingredients across cakes

### Sub-Recipe Processing
- Handles unlimited nesting levels
- Tracks sub-recipe usage and costs
- Prevents circular dependencies
- Provides detailed breakdown by source

### Cost Analysis
- Ingredient-level cost calculation
- Sub-recipe unit cost tracking
- Total batch cost summation
- Currency formatting and precision

## 🚀 Getting Started

### Prerequisites
- FastAPI backend running
- React frontend with Vite
- MySQL database
- Authentication system

### Installation
1. **Database Setup**:
   ```bash
   python create_batch_tables.py
   ```

2. **Backend**: The endpoints are automatically included in `main.py`

3. **Frontend**: The component is integrated into the Dashboard

### Development
```bash
# Start backend
python -m uvicorn main:app --reload

# Start frontend  
npm run dev
```

## 📈 Performance Features

### Backend Optimizations
- **🔄 Efficient Queries**: Optimized database queries with proper joins
- **💾 Lazy Loading**: Session details loaded only when needed
- **🎯 Selective Updates**: Update only changed session items
- **🛡️ Error Handling**: Graceful error handling with informative messages

### Frontend Optimizations
- **⚡ Debounced Search**: Prevents excessive API calls
- **🔄 Auto-focus**: Maintains focus on search input for rapid entry
- **📱 Progressive Enhancement**: Works without JavaScript (basic functionality)
- **🎨 Smooth Animations**: Responsive UI transitions

## 🔒 Security Features

- **🛡️ Authentication Required**: All endpoints require user authentication
- **👤 User Isolation**: Users can only access their own sessions
- **🔐 Input Validation**: Server-side validation of all inputs
- **🚫 SQL Injection Protection**: Parameterized queries throughout

## 🐛 Error Handling

### Backend Errors
- Insufficient cakes (< 2) validation
- Missing ingredients/sub-recipes handling
- Database connection error recovery
- Authentication failure responses

### Frontend Errors
- Network connectivity issues
- Invalid input validation
- Session loading failures
- User-friendly error messages

## 📝 Future Enhancements

### Planned Features
- **📤 Excel Export**: Export calculation results to Excel
- **📊 Batch History**: Track calculation history over time
- **🔄 Recipe Templates**: Save common batch configurations
- **📈 Cost Analysis**: Historical cost tracking and trends
- **🏷️ Batch Tagging**: Categorize batches by type or customer

### Technical Improvements
- **⚡ Caching**: Redis caching for frequently accessed data
- **📊 Analytics**: Usage analytics and optimization insights
- **🔄 Real-time Updates**: WebSocket support for collaborative editing
- **📱 PWA Support**: Progressive Web App capabilities

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure mobile responsiveness
5. Test with real data

---

**Built with ❤️ for efficient bakery production management** 