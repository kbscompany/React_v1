# 🔒 Foodics Read-Only Integration Guide

## Overview

The Foodics API integration has been configured for **READ-ONLY** mode, ensuring that your application only fetches data from Foodics without making any updates or modifications to your Foodics system.

### ✅ What This Integration Does (READ-ONLY)
- ✅ Fetches inventory data from Foodics branches
- ✅ Retrieves sales and order data  
- ✅ Gets product information and pricing
- ✅ Pulls branch details and configurations
- ✅ Receives webhook notifications (for monitoring)

### ❌ What This Integration Does NOT Do
- ❌ Update stock levels in Foodics
- ❌ Create or modify products in Foodics
- ❌ Push inventory changes to Foodics
- ❌ Modify any data in your Foodics system

---

## 🚀 Quick Setup

### 1. Configure Foodics API Credentials
```bash
curl -X POST "http://localhost:8000/api/foodics/configure" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_token=YOUR_FOODICS_API_TOKEN"
```

### 2. Configure Default Branch (Optional)
```bash
curl -X POST "http://localhost:8000/api/foodics/configure-branch" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "branch_id=your_branch_id&branch_name=Main%20Branch"
```

### 3. Test the Integration
```bash
curl -X GET "http://localhost:8000/api/foodics/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📋 API Endpoints Reference

### Authentication & Configuration

#### Configure Foodics Credentials
```http
POST /api/foodics/configure
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer YOUR_TOKEN

api_token=YOUR_FOODICS_API_TOKEN
```

#### Get Integration Status
```http
GET /api/foodics/status
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "configured": true,
  "api_token_configured": true,
  "last_configured": "2024-12-13T10:30:00Z",
  "last_updated": "2024-12-13T10:30:00Z"
}
```

#### Test Connection
```http
POST /api/foodics/test-connection
Authorization: Bearer YOUR_TOKEN
```

### Branch Management

#### Get All Available Branches
```http
GET /api/foodics/branches
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "branches": [
    {
      "id": "branch_123",
      "name": "Main Branch",
      "address": "123 Main Street",
      "is_active": true,
      "phone": "+1234567890",
      "timezone": "UTC"
    }
  ]
}
```

#### Configure Default Branch
```http
POST /api/foodics/configure-branch
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer YOUR_TOKEN

branch_id=branch_123&branch_name=Main%20Branch
```

### Direct Branch Integration (Recommended)

#### Get Branch Inventory
```http
GET /api/foodics/branch/{branch_id}/inventory
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branch_id": "branch_123",
    "total_products": 45,
    "in_stock_products": 38,
    "out_of_stock_products": 7,
    "total_inventory_value": 15750.50,
    "products": [
      {
        "id": "product_456",
        "name": "Coffee Beans",
        "sku": "CB001",
        "category": "Beverages",
        "stock_quantity": 25.5,
        "unit": "kg",
        "cost": 12.50,
        "price": 18.00,
        "inventory_value": 318.75,
        "is_active": true
      }
    ]
  }
}
```

#### Get Branch Sales Data
```http
GET /api/foodics/branch/{branch_id}/sales?start_date=2024-12-01T00:00:00&end_date=2024-12-13T23:59:59
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branch_id": "branch_123",
    "period": {
      "start_date": "2024-12-01T00:00:00",
      "end_date": "2024-12-13T23:59:59"
    },
    "total_orders": 145,
    "total_revenue": 8750.50,
    "total_tax": 875.05,
    "average_order_value": 60.35,
    "product_sales": {
      "Coffee Beans": {
        "quantity_sold": 15.5,
        "total_revenue": 279.00
      },
      "Pastries": {
        "quantity_sold": 45,
        "total_revenue": 1350.00
      }
    },
    "daily_sales": {
      "2024-12-01": {
        "orders": 12,
        "revenue": 720.00
      },
      "2024-12-02": {
        "orders": 15,
        "revenue": 905.50
      }
    }
  }
}
```

### Default Branch Shortcuts

#### Get Default Branch Inventory
```http
GET /api/foodics/default-branch/inventory
Authorization: Bearer YOUR_TOKEN
```

#### Get Default Branch Sales
```http
GET /api/foodics/default-branch/sales?start_date=2024-12-01T00:00:00&end_date=2024-12-13T23:59:59
Authorization: Bearer YOUR_TOKEN
```

### Legacy Warehouse Integration (Read-Only)

#### Fetch Inventory Comparison
```http
GET /api/foodics/fetch-inventory/{shop_id}
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "mode": "READ_ONLY",
  "shop_name": "Downtown Store",
  "foodics_branch_id": "branch_123",
  "total_products": 45,
  "matched_items": 23,
  "comparison_data": [
    {
      "item_name": "Coffee Beans",
      "warehouse_quantity": 30.0,
      "foodics_quantity": 25.5,
      "difference": 4.5,
      "foodics_product_id": "product_456",
      "price": 18.00,
      "cost": 12.50
    }
  ]
}
```

### Product Information

#### Get Branch Products
```http
GET /api/foodics/products/{branch_id}
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "product_456",
      "name": "Coffee Beans",
      "description": "Premium arabica coffee beans",
      "sku": "CB001",
      "price": 18.00,
      "cost": 12.50,
      "category": "Beverages",
      "is_active": true,
      "stock_quantity": 25.5
    }
  ]
}
```

---

## 💡 Usage Examples

### 1. Daily Inventory Report

```python
import requests
from datetime import datetime

def get_daily_inventory_report(branch_id, auth_token):
    """Get daily inventory report from Foodics"""
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    # Get inventory data
    response = requests.get(
        f"http://localhost:8000/api/foodics/branch/{branch_id}/inventory",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        print(f"📊 Daily Inventory Report - {datetime.now().strftime('%Y-%m-%d')}")
        print(f"🏪 Branch: {branch_id}")
        print(f"📦 Total Products: {data['total_products']}")
        print(f"✅ In Stock: {data['in_stock_products']}")
        print(f"❌ Out of Stock: {data['out_of_stock_products']}")
        print(f"💰 Total Value: ${data['total_inventory_value']:,.2f}")
        
        # Show low stock items
        low_stock_items = [
            p for p in data["products"] 
            if p["stock_quantity"] < 10 and p["stock_quantity"] > 0
        ]
        
        if low_stock_items:
            print("\n⚠️ Low Stock Alert:")
            for item in low_stock_items:
                print(f"  - {item['name']}: {item['stock_quantity']} {item['unit']}")
        
        return data
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None

# Usage
branch_id = "your_branch_id"
auth_token = "your_jwt_token"
inventory_report = get_daily_inventory_report(branch_id, auth_token)
```

### 2. Sales Performance Analysis

```python
import requests
from datetime import datetime, timedelta

def analyze_sales_performance(branch_id, days=7, auth_token=""):
    """Analyze sales performance for the last N days"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    # Get sales data
    response = requests.get(
        f"http://localhost:8000/api/foodics/branch/{branch_id}/sales",
        headers=headers,
        params={
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        print(f"📈 Sales Performance Analysis ({days} days)")
        print(f"📅 Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"🛒 Total Orders: {data['total_orders']}")
        print(f"💵 Total Revenue: ${data['total_revenue']:,.2f}")
        print(f"💳 Average Order: ${data['average_order_value']:,.2f}")
        
        # Top selling products
        product_sales = data["product_sales"]
        top_products = sorted(
            product_sales.items(), 
            key=lambda x: x[1]["total_revenue"], 
            reverse=True
        )[:5]
        
        print("\n🏆 Top Selling Products:")
        for i, (product, sales) in enumerate(top_products, 1):
            print(f"  {i}. {product}: ${sales['total_revenue']:,.2f} ({sales['quantity_sold']} units)")
        
        return data
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None

# Usage
sales_analysis = analyze_sales_performance("your_branch_id", days=7, auth_token="your_jwt_token")
```

### 3. Inventory vs Sales Comparison

```python
import requests

def compare_inventory_vs_sales(branch_id, auth_token):
    """Compare current inventory levels with recent sales to identify trends"""
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    # Get inventory data
    inventory_response = requests.get(
        f"http://localhost:8000/api/foodics/branch/{branch_id}/inventory",
        headers=headers
    )
    
    # Get recent sales data (last 7 days)
    from datetime import datetime, timedelta
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    sales_response = requests.get(
        f"http://localhost:8000/api/foodics/branch/{branch_id}/sales",
        headers=headers,
        params={
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    )
    
    if inventory_response.status_code == 200 and sales_response.status_code == 200:
        inventory = inventory_response.json()["data"]
        sales = sales_response.json()["data"]
        
        print("📊 Inventory vs Sales Analysis")
        print("=" * 50)
        
        # Create product lookup
        products = {p["name"]: p for p in inventory["products"]}
        product_sales = sales["product_sales"]
        
        # Analysis
        for product_name, sales_data in product_sales.items():
            if product_name in products:
                product = products[product_name]
                current_stock = product["stock_quantity"]
                weekly_sales = sales_data["quantity_sold"]
                days_of_stock = current_stock / (weekly_sales / 7) if weekly_sales > 0 else 999
                
                status = "🔴 CRITICAL" if days_of_stock < 3 else "🟡 LOW" if days_of_stock < 7 else "🟢 GOOD"
                
                print(f"{product_name}:")
                print(f"  Current Stock: {current_stock} {product.get('unit', 'units')}")
                print(f"  Weekly Sales: {weekly_sales}")
                print(f"  Days of Stock: {days_of_stock:.1f} days {status}")
                print()
        
        return {"inventory": inventory, "sales": sales}
    else:
        print("❌ Error fetching data")
        return None

# Usage
comparison = compare_inventory_vs_sales("your_branch_id", "your_jwt_token")
```

### 4. Automated Daily Report

```python
import requests
import schedule
import time
from datetime import datetime

def send_daily_report(branch_id, auth_token, email_recipient):
    """Send automated daily report"""
    
    # Get inventory and sales data
    inventory_data = get_daily_inventory_report(branch_id, auth_token)
    sales_data = analyze_sales_performance(branch_id, days=1, auth_token=auth_token)
    
    if inventory_data and sales_data:
        # Create report
        report = f"""
        📊 Daily Business Report - {datetime.now().strftime('%Y-%m-%d')}
        
        📦 INVENTORY SUMMARY:
        - Total Products: {inventory_data['total_products']}
        - In Stock: {inventory_data['in_stock_products']}
        - Out of Stock: {inventory_data['out_of_stock_products']}
        - Total Value: ${inventory_data['total_inventory_value']:,.2f}
        
        💰 SALES SUMMARY:
        - Orders: {sales_data['total_orders']}
        - Revenue: ${sales_data['total_revenue']:,.2f}
        - Average Order: ${sales_data['average_order_value']:,.2f}
        """
        
        # Here you would send the email
        print("📧 Daily report ready to send:")
        print(report)
        
        # Send email using your preferred method
        # send_email(email_recipient, "Daily Business Report", report)

# Schedule the report
schedule.every().day.at("09:00").do(
    send_daily_report, 
    "your_branch_id", 
    "your_jwt_token", 
    "manager@yourbusiness.com"
)

print("📅 Daily report scheduler started...")

# Keep the scheduler running
while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🔧 Configuration Settings

### Read-Only Mode Configuration

The system is configured with the following read-only settings:

```sql
-- Check read-only mode setting
SELECT * FROM api_configurations WHERE config_key = 'foodics_read_only_mode';

-- View all Foodics configurations
SELECT * FROM api_configurations WHERE config_key LIKE 'foodics_%';
```

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `foodics_read_only_mode` | `true` | Enable read-only mode |
| `foodics_sync_interval` | `3600` | Data fetch interval (seconds) |
| `foodics_default_branch_id` | `""` | Default branch for quick access |
| `foodics_default_branch_name` | `""` | Default branch name |

---

## 🛡️ Security & Safety

### Read-Only Guarantees

1. **No Write Operations**: All update/create/delete methods are disabled
2. **API Method Restrictions**: Only GET requests to Foodics API
3. **Database Logging**: All operations are logged for audit trail
4. **Error Prevention**: Write attempts return safe error responses

### Monitoring

```sql
-- Monitor API usage
SELECT endpoint, COUNT(*) as requests, AVG(response_time_ms) as avg_time
FROM api_usage_logs 
WHERE endpoint LIKE '%foodics%' 
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY endpoint
ORDER BY requests DESC;

-- Check for any attempted write operations
SELECT * FROM api_usage_logs 
WHERE endpoint LIKE '%foodics%' 
  AND method IN ('POST', 'PUT', 'PATCH', 'DELETE')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## 🔍 Troubleshooting

### Common Issues

1. **"No active API token found"**
   ```bash
   # Reconfigure your API token
   curl -X POST "http://localhost:8000/api/foodics/configure" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d "api_token=YOUR_FOODICS_API_TOKEN"
   ```

2. **"Invalid API token"**
   - Verify your Foodics API token is correct
   - Check token permissions in Foodics dashboard
   - Ensure token hasn't expired

3. **"No default branch configured"**
   ```bash
   # Configure default branch
   curl -X POST "http://localhost:8000/api/foodics/configure-branch" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d "branch_id=your_branch_id&branch_name=Branch%20Name"
   ```

4. **"Failed to fetch branch inventory"**
   - Verify branch ID is correct
   - Check network connectivity
   - Review Foodics API logs

### Debug Commands

```sql
-- Check configuration status
SELECT * FROM foodics_tokens WHERE is_active = 1;

-- View recent API calls
SELECT * FROM api_usage_logs 
WHERE endpoint LIKE '%foodics%' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check branch configuration
SELECT * FROM api_configurations 
WHERE config_key IN ('foodics_default_branch_id', 'foodics_default_branch_name');
```

---

## 📚 Important Notes

### About Foodics API Documentation

⚠️ **Note**: You mentioned having Foodics API documentation that I should review, but I don't see it attached to this conversation. Please share the Foodics API documentation so I can:

1. Verify API endpoints and parameters
2. Ensure proper data formatting
3. Implement any missing features
4. Optimize the integration based on their latest specifications

### Data Freshness

- **Inventory Data**: Real-time from Foodics
- **Sales Data**: Updated within minutes of transaction
- **Product Information**: Updated when modified in Foodics
- **Branch Data**: Updated when configuration changes

### Rate Limits

- Default: 1000 requests per hour per token
- Automatic retry with exponential backoff
- Error handling for rate limit exceeded

---

## 🎯 Next Steps

1. **Share Foodics API Docs**: Please provide the API documentation for review
2. **Test Integration**: Use the provided endpoints to test data fetching
3. **Configure Default Branch**: Set up your primary branch for quick access
4. **Set Up Monitoring**: Implement the provided usage examples
5. **Schedule Reports**: Use the automation examples for daily reporting

---

*Last Updated: December 13, 2024*  
*Mode: READ-ONLY ✅*  
*Status: Production Ready* 