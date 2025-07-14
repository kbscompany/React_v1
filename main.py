from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
import schemas
import models
from database import engine, get_db
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash
)
from config import settings
import os
import uuid
import shutil
import json
import logging
from pathlib import Path
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Foodics service
try:
    from foodics_service import FoodicsService, SecureFoodicsService
    foodics_available = True
    logger.info("Foodics service loaded successfully")
except ImportError as e:
    foodics_available = False
    logger.warning(f"Foodics service not available - using basic mode: {e}")
except Exception as e:
    foodics_available = False
    logger.warning(f"Foodics service error: {e}")

# Import all routers
from routers import auth_routes, safe_routes, category_routes, simple_routes, expense_routes, item_routes, kitchen_routes, admin_routes

# Create upload directories
UPLOAD_DIR = "uploads/expense_files"
EARLY_SETTLEMENT_UPLOAD_DIR = "uploads/early_settlement_files"
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(EARLY_SETTLEMENT_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Create tables
models.Base.metadata.create_all(bind=engine)

# Import warehouse endpoints router (if it exists)
try:
    import warehouse_endpoints
    has_warehouse_router = True
except ImportError:
    has_warehouse_router = False

# Create FastAPI instance
app = FastAPI(title="Warehouse & Expense Management System")

# Add CORS middleware with secure configuration
# When allow_credentials=True, we cannot use wildcard origins
cors_origins = settings.cors_origins if settings.environment == "production" else [
    "http://localhost:3000", 
    "http://localhost:5173", 
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Use configured origins for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],  # Include HEAD
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Custom-Header"
    ],
    expose_headers=["*"],
    max_age=600,
)

# Add custom CORS middleware for specific endpoints
@app.middleware("http")
async def add_cors_and_security_headers(request, call_next):
    # Handle preflight requests
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        if origin and origin in ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]:
            response = Response(status_code=200)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "600"
            return response
    
    response = await call_next(request)
    
    # Add CORS headers to all responses
    origin = request.headers.get("origin")
    if origin and origin in ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Only add HSTS in production with HTTPS
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Include all routers
app.include_router(auth_routes.router)
app.include_router(safe_routes.router)
app.include_router(category_routes.router)
app.include_router(simple_routes.router)  # For direct simple endpoints
app.include_router(expense_routes.router)
app.include_router(item_routes.router)
app.include_router(kitchen_routes.router)  # Kitchen production endpoints
app.include_router(admin_routes.router)  # Super admin endpoints

# Include new bank and cheque book routes
from routers import bank_routes, cheque_book_routes, bank_account_routes
app.include_router(bank_routes.router)
app.include_router(cheque_book_routes.router)
app.include_router(bank_account_routes.router)  # Bank account endpoints

# Import and include purchase order router
from purchase_order_api import router as purchase_order_router
app.include_router(purchase_order_router)

# Import and include warehouse API router (for shop functionality)
from warehouse_api import router as warehouse_api_router
app.include_router(warehouse_api_router)

# Import and include Arabic cheque generator router
from arabic_cheque_generator import router as arabic_cheque_router
app.include_router(arabic_cheque_router)

# Legacy endpoints for backward compatibility
@app.post("/token", response_model=schemas.Token)
async def login_legacy(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Legacy login endpoint for backward compatibility"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.options("/token")
async def token_options():
    """Handle preflight OPTIONS request for /token endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "600"
        }
    )

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me_legacy(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Legacy users/me endpoint for backward compatibility"""
    user_with_role = db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == current_user.id).first()
    if not user_with_role:
        raise HTTPException(status_code=404, detail="User not found")
    return user_with_role

@app.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    current_user: models.User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    """Get all users for warehouse manager assignments"""
    try:
        # Get all active users with their roles
        users = db.query(models.User).options(joinedload(models.User.role)).filter(
            models.User.is_active == True
        ).order_by(models.User.username).all()
        
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Basic endpoint to test server
@app.get("/")
async def root():
    return {"message": "FastAPI Server is running", "status": "OK", "version": "2.0 - Modular"}

@app.get("/test")
async def test():
    return {"status": "API is working", "timestamp": datetime.now().isoformat()}

# Items management endpoints for IngredientManagement component
@app.get("/items-for-ingredients")
async def get_items_for_ingredients(db: Session = Depends(get_db)):
    """Get items for ingredient management"""
    try:
        result = db.execute(text("""
            SELECT i.id, i.name, i.unit, i.price_per_unit, i.category_id,
                   ic.name as category_name
            FROM items i
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            ORDER BY i.name ASC
        """))
        
        items = []
        for row in result:
            items.append({
                "id": row[0],
                "name": row[1] or "Unknown Item",
                "unit": row[2] or "units", 
                "price_per_unit": float(row[3]) if row[3] else 0.0,
                "category_id": row[4],
                "category_name": row[5] or "Uncategorized"
            })
        
        return {"success": True, "data": items}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}

@app.post("/items-for-ingredients")
async def create_item_for_ingredients(item_data: dict, db: Session = Depends(get_db)):
    """Create item for ingredient management"""
    try:
        name = item_data.get("name")
        unit = item_data.get("unit", "units")
        price_per_unit = item_data.get("price_per_unit", 0.0)
        category_id = item_data.get("category_id")
        
        if not name:
            raise HTTPException(status_code=400, detail="Item name is required")
        
        # Insert new item
        db.execute(text("""
            INSERT INTO items (name, unit, price_per_unit, category_id)
            VALUES (:name, :unit, :price_per_unit, :category_id)
        """), {
            "name": name,
            "unit": unit,
            "price_per_unit": price_per_unit,
            "category_id": category_id
        })
        
        db.commit()
        return {"success": True, "message": "Item created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/items-for-ingredients/{item_id}")
async def update_item_for_ingredients(item_id: int, item_data: dict, db: Session = Depends(get_db)):
    """Update item for ingredient management"""
    try:
        name = item_data.get("name")
        unit = item_data.get("unit", "units")
        price_per_unit = item_data.get("price_per_unit", 0.0)
        category_id = item_data.get("category_id")
        
        if not name:
            raise HTTPException(status_code=400, detail="Item name is required")
        
        # Update item
        db.execute(text("""
            UPDATE items 
            SET name = :name, unit = :unit, price_per_unit = :price_per_unit, category_id = :category_id
            WHERE id = :id
        """), {
            "name": name,
            "unit": unit,
            "price_per_unit": price_per_unit,
            "category_id": category_id,
            "id": item_id
        })
        
        db.commit()
        return {"success": True, "message": "Item updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/items-for-ingredients/{item_id}")
async def delete_item_for_ingredients(item_id: int, db: Session = Depends(get_db)):
    """Delete item for ingredient management"""
    try:
        # Delete the item
        db.execute(text("DELETE FROM items WHERE id = :id"), {"id": item_id})
        db.commit()
        return {"success": True, "message": "Item deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Essential cheque endpoints for frontend compatibility
@app.put("/cheques/{cheque_id}")
async def update_cheque(
    cheque_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Update cheque amount and status"""
    try:
        # Check if cheque exists
        cheque = db.execute(text("SELECT id, is_assigned_to_safe FROM cheques WHERE id = :id"), 
                           {"id": cheque_id}).fetchone()
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        # Update cheque
        amount = update_data.get("amount")
        status = update_data.get("status")
        
        if amount is not None:
            db.execute(text("UPDATE cheques SET amount = :amount WHERE id = :id"), 
                      {"amount": amount, "id": cheque_id})
        
        if status is not None:
            db.execute(text("UPDATE cheques SET status = :status WHERE id = :id"), 
                      {"status": status, "id": cheque_id})
        
        db.commit()
        
        return {"success": True, "message": "Cheque updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/cheques/assign-to-safe")
async def assign_cheques_to_safe(
    assignment_data: dict,
    db: Session = Depends(get_db)
):
    """Assign cheques to a safe"""
    try:
        safe_id = assignment_data.get("safe_id")
        cheque_ids = assignment_data.get("cheque_ids", [])
        
        if not safe_id or not cheque_ids:
            raise HTTPException(status_code=400, detail="Safe ID and cheque IDs are required")
        
        # Verify safe exists and is active
        safe = db.execute(text("SELECT id, name, is_active FROM safes WHERE id = :id"), 
                         {"id": safe_id}).fetchone()
        if not safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        if not safe[2]:  # is_active
            raise HTTPException(status_code=400, detail="Cannot assign cheques to inactive safe")
        
        # Process each cheque
        assigned_count = 0
        total_amount_assigned = 0.0
        
        for cheque_id in cheque_ids:
            # Check if cheque exists and is not already assigned
            cheque = db.execute(text("SELECT id, cheque_number, is_assigned_to_safe, amount FROM cheques WHERE id = :id"), 
                               {"id": cheque_id}).fetchone()
            
            if not cheque:
                continue
            
            if cheque[2]:  # is_assigned_to_safe
                continue
            
            # Assign cheque to safe
            db.execute(text("""
                UPDATE cheques 
                SET safe_id = :safe_id, is_assigned_to_safe = 1, status = 'assigned'
                WHERE id = :cheque_id
            """), {"safe_id": safe_id, "cheque_id": cheque_id})
            
            assigned_count += 1
            total_amount_assigned += float(cheque[3]) if cheque[3] else 0.0
        
        # Update safe balance with total amount of assigned cheques
        if assigned_count > 0:
            db.execute(text("""
                UPDATE safes 
                SET current_balance = current_balance + :amount
                WHERE id = :safe_id
            """), {"amount": total_amount_assigned, "safe_id": safe_id})
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Assigned {assigned_count} cheque(s) to {safe[1]}",
            "assigned_count": assigned_count
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/cheques/{cheque_id}/cancel")
async def cancel_cheque_main(
    cheque_id: int,
    cancel_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Cancel a cheque with proper permission checking"""
    try:
        # Check user permissions - only Admin, Manager, and Accountant can cancel cheques
        # Role IDs: 1=Admin, 2=Manager/Warehouse Manager, 3=Staff (includes Accountant)
        if current_user.role_id not in [1, 2, 3]:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to cancel cheques"
            )
        
        # Get the cheque details
        cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.status, c.is_settled, 
                   c.safe_id, c.amount,
                   COALESCE(
                       (SELECT SUM(e.amount) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected'),
                       0
                   ) as total_expenses
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id}).fetchone()
        
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        # Check if cheque can be cancelled
        if cheque[3]:  # is_settled
            raise HTTPException(status_code=400, detail="Cannot cancel a settled cheque")
        
        if cheque[2] == 'cancelled':  # status
            raise HTTPException(status_code=400, detail="Cheque is already cancelled")
        
        # Check if cheque has expenses
        total_expenses = float(cheque[6])
        if total_expenses > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel cheque with existing expenses (${total_expenses:.2f}). Please reject all expenses first."
            )
        
        # Get cancellation reason from request
        cancellation_reason = cancel_data.get("reason", "No reason provided")
        
        # Cancel the cheque
        db.execute(text("""
            UPDATE cheques 
            SET status = 'cancelled',
                description = CONCAT(COALESCE(description, ''), ' | CANCELLED: ', :reason, ' (by user ID: ', :user_id, ' on ', NOW(), ')'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :cheque_id
        """), {
            "cheque_id": cheque_id,
            "reason": cancellation_reason,
            "user_id": current_user.id
        })
        
        # If cheque was assigned to a safe, update the safe balance
        if cheque[4]:  # safe_id
            db.execute(text("""
                UPDATE safes 
                SET current_balance = current_balance - :amount
                WHERE id = :safe_id
            """), {
                "amount": float(cheque[5]),  # cheque amount
                "safe_id": cheque[4]
            })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Cheque {cheque[1]} has been cancelled successfully",
            "cancelled_by": current_user.username,
            "cancellation_reason": cancellation_reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cancel cheque: {str(e)}")

@app.get("/cheques/unassigned")
async def get_unassigned_cheques(db: Session = Depends(get_db)):
    """Get all unassigned cheques"""
    try:
        result = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.description, c.issued_to,
                   ba.account_name, ba.bank_name, ba.id as bank_account_id
            FROM cheques c
            LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
            WHERE c.is_assigned_to_safe = 0
            AND c.is_settled = 0
            ORDER BY c.cheque_number
        """))
        
        cheques = []
        for row in result:
            cheques.append({
                "id": row[0],
                "cheque_number": row[1],
                "amount": float(row[2]) if row[2] else 0.0,
                "description": row[3] or "",
                "issued_to": row[4] or "",  # Add issued_to field
                "bank_account": f"{row[5]} ({row[6]})" if row[5] else "Unknown",  # Update indices
                "bank_account_id": row[7],
                "expense_id": row[8]  
            })
        
        return cheques
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/safes/{safe_id}/cheques")
async def get_safe_cheques(
    safe_id: int,
    limit: int = Query(10, description="Number of cheques to return (default: 10 for settled, all for active)"),
    offset: int = Query(0, description="Number of cheques to skip"),
    cheque_number: Optional[str] = Query(None, description="Filter by cheque number"),
    start_date: Optional[str] = Query(None, description="Filter by settlement date (start)"),
    end_date: Optional[str] = Query(None, description="Filter by settlement date (end)"),
    status_filter: Optional[str] = Query(None, description="Filter by status: settled, active, all"),
    db: Session = Depends(get_db)
):
    """Get cheques assigned to a specific safe with pagination and filtering"""
    try:
        # Verify safe exists
        safe = db.execute(text("SELECT id, name FROM safes WHERE id = :id"), 
                         {"id": safe_id}).fetchone()
        if not safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        # Build WHERE conditions
        where_conditions = ["c.safe_id = :safe_id", "c.is_assigned_to_safe = 1"]
        params = {"safe_id": safe_id}
        
        # Add filtering conditions
        if cheque_number:
            where_conditions.append("c.cheque_number LIKE :cheque_number")
            params["cheque_number"] = f"%{cheque_number}%"
        
        if start_date:
            where_conditions.append("DATE(c.settlement_date) >= :start_date")
            params["start_date"] = start_date
            
        if end_date:
            where_conditions.append("DATE(c.settlement_date) <= :end_date")
            params["end_date"] = end_date
            
        if status_filter == "settled":
            where_conditions.append("c.is_settled = 1")
        elif status_filter == "active":
            where_conditions.append("c.is_settled = 0")
        # "all" or None means no status filter
        
        where_clause = " AND ".join(where_conditions)
        
        # Determine ordering - settled cheques by settlement date DESC, active by cheque number
        if status_filter == "settled":
            order_clause = "ORDER BY c.settlement_date DESC, c.cheque_number DESC"
        else:
            order_clause = "ORDER BY c.cheque_number"
            
        # Build pagination - for settled cheques, default to limit 10, for active show all
        if status_filter == "settled" or (status_filter is None and limit == 10):
            limit_clause = f"LIMIT {limit} OFFSET {offset}"
        elif status_filter == "active":
            limit_clause = ""  # Show all active cheques
        else:
            limit_clause = f"LIMIT {limit} OFFSET {offset}"
        
        # Get cheques assigned to this safe
        result = db.execute(text(f"""
            SELECT c.id, c.cheque_number, c.amount, c.status, 
                   c.issue_date, c.due_date, c.description, c.issued_to,
                   ba.account_name, ba.bank_name,
                   COALESCE(
                       (SELECT SUM(e.amount) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected'),
                       0
                   ) as total_expenses,
                   c.amount - COALESCE(
                       (SELECT SUM(e.amount) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected'),
                       0
                   ) as remaining_amount,
                   c.is_settled,
                   c.overspent_amount,
                   c.settlement_date,
                   c.safe_id,
                   c.settled_by_cheque_id,
                   c.is_printed,
                   c.printed_at,
                   c.print_count,
                   (SELECT GROUP_CONCAT(e.id ORDER BY e.id) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected') as expense_ids
            FROM cheques c
            LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
            WHERE {where_clause}
            {order_clause}
            {limit_clause}
        """), params)
        
        cheques = []
        for row in result:
            total_expenses = float(row[10]) if row[10] else 0.0  # Updated index (due_date added)
            cheque_amount = float(row[2]) if row[2] else 0.0
            remaining_amount = float(row[11]) if row[11] else cheque_amount  # Updated index
            is_overspent = total_expenses > cheque_amount
            
            # Calculate overspent amount
            overspent_amount = float(row[13]) if row[13] else 0.0  # Updated index
            if is_overspent and overspent_amount == 0.0:
                overspent_amount = total_expenses - cheque_amount
            
            # Check for settlement attachments if cheque is settled
            attachments = []
            if bool(row[12]):  # is_settled (updated index)
                try:
                    import glob
                    attachment_pattern = os.path.join(EARLY_SETTLEMENT_UPLOAD_DIR, f"settlement_{row[0]}_*")
                    attachment_files = glob.glob(attachment_pattern)
                    
                    for file_path in attachment_files:
                        if os.path.exists(file_path):
                            file_size = os.path.getsize(file_path)
                            file_name = os.path.basename(file_path)
                            # Extract original filename from unique filename
                            original_name = file_name.split('_', 3)[-1] if '_' in file_name else file_name
                            attachments.append({
                                "filename": file_name,
                                "original_filename": original_name,
                                "file_size": file_size,
                                "file_path": file_path
                            })
                except Exception as e:
                    print(f"Error checking attachments for cheque {row[0]}: {e}")
            
            # Parse expense IDs from comma-separated string
            expense_ids_str = row[20] if len(row) > 20 and row[20] else ""  # Updated index
            expense_ids = [int(id.strip()) for id in expense_ids_str.split(",") if id.strip().isdigit()] if expense_ids_str else []
            
            cheques.append({
                "id": row[0],
                "cheque_number": row[1],
                "amount": cheque_amount,
                "status": row[3] or "assigned",
                "issue_date": row[4].isoformat() if row[4] else None,
                "due_date": row[5].isoformat() if row[5] else None,  # Add due_date field
                "description": row[6] or "",  # Updated index
                "issued_to": row[7] or "",  # Updated index
                "bank_account": f"{row[8]} ({row[9]})" if row[8] else "Unknown",  # Updated indices
                "total_expenses": total_expenses,
                "remaining_amount": remaining_amount,
                "is_settled": bool(row[12]),  # Updated index
                "is_overspent": is_overspent,
                "overspent_amount": overspent_amount,
                "settlement_date": row[14].isoformat() if row[14] else None,  # Updated index
                "safe_id": safe_id,  # Use the safe_id parameter directly
                "settled_by_cheque_id": row[16] if len(row) > 16 else None,  # Updated index
                "is_printed": bool(row[17]) if len(row) > 17 else False,  # Print status (updated index)
                "printed_at": row[18].isoformat() if len(row) > 18 and row[18] else None,  # Print timestamp (updated index)
                "print_count": row[19] if len(row) > 19 else 0,  # Print count (updated index)
                "expense_ids": expense_ids,  # Related expense IDs
                "expense_count": len(expense_ids),  # Count of expenses
                "attachments": attachments,
                "has_attachments": len(attachments) > 0
            })
        
        return cheques
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/cheques/manual-settlement-simple")
async def manual_settle_overspent_cheque(
    settlement_data: dict,
    db: Session = Depends(get_db)
):
    """Manually settle an overspent cheque using an existing cheque"""
    try:
        overspent_cheque_id = settlement_data.get("overspent_cheque_id")
        settlement_cheque_id = settlement_data.get("settlement_cheque_id")
        settlement_amount = settlement_data.get("settlement_amount", 0)
        notes = settlement_data.get("notes", "Manual settlement")
        
        if not all([overspent_cheque_id, settlement_cheque_id]):
            raise HTTPException(status_code=400, detail="Both overspent and settlement cheque IDs are required")
        
        # Get the overspent cheque details with calculated expenses
        overspent_cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.status, 
                   c.safe_id, c.is_settled, c.bank_account_id,
                   COALESCE(
                       (SELECT SUM(e.amount) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected'),
                       0
                   ) as total_expenses
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": overspent_cheque_id}).fetchone()
        
        if not overspent_cheque:
            raise HTTPException(status_code=404, detail="Overspent cheque not found")
        
        if overspent_cheque[5]:  # is_settled
            raise HTTPException(status_code=400, detail="Cheque is already settled")
        
        # Calculate the actual overspent amount
        cheque_amount = float(overspent_cheque[2]) if overspent_cheque[2] else 0.0
        total_expenses = float(overspent_cheque[7]) if overspent_cheque[7] else 0.0
        calculated_overspent_amount = max(0, total_expenses - cheque_amount)
        
        if calculated_overspent_amount <= 0:
            raise HTTPException(status_code=400, detail="Cheque is not overspent")
        
        # Get the settlement cheque details
        settlement_cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.status, 
                   c.is_assigned_to_safe, c.safe_id
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": settlement_cheque_id}).fetchone()
        
        if not settlement_cheque:
            raise HTTPException(status_code=404, detail="Settlement cheque not found")
        
        if settlement_cheque[4]:  # is_assigned_to_safe
            raise HTTPException(status_code=400, detail="Settlement cheque is already assigned to a safe")
        
        # Use the calculated overspent amount or the provided settlement amount
        actual_settlement_amount = settlement_amount if settlement_amount > 0 else calculated_overspent_amount
        
        # Assign the settlement cheque to the same safe and set its amount
        db.execute(text("""
            UPDATE cheques 
            SET amount = :amount,
                safe_id = :safe_id,
                is_assigned_to_safe = 1,
                status = 'assigned',
                description = :description
            WHERE id = :cheque_id
        """), {
            "amount": actual_settlement_amount,
            "safe_id": overspent_cheque[4],  # Updated index for safe_id
            "description": f"Settlement for overspent cheque {overspent_cheque[1]}",
            "cheque_id": settlement_cheque_id
        })
        
        # Update the overspent cheque as settled
        db.execute(text("""
            UPDATE cheques 
            SET is_settled = 1, 
                status = 'settled',
                settled_by_cheque_id = :settlement_cheque_id,
                settlement_date = CURRENT_TIMESTAMP
            WHERE id = :cheque_id
        """), {
            "settlement_cheque_id": settlement_cheque_id,
            "cheque_id": overspent_cheque_id
        })
        
        # Update safe balance (add the settlement amount)
        db.execute(text("""
            UPDATE safes 
            SET current_balance = current_balance + :amount
            WHERE id = :safe_id
        """), {
            "amount": actual_settlement_amount,
            "safe_id": overspent_cheque[4]  # Updated index for safe_id
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Settlement completed successfully",
            "details": f"Overspent cheque {overspent_cheque[1]} settled with cheque {settlement_cheque[1]} for ${actual_settlement_amount:.2f}",
            "settlement_info": {
                "overspent_cheque": overspent_cheque[1],
                "settlement_cheque": settlement_cheque[1],
                "amount": actual_settlement_amount,
                "cheque_amount": cheque_amount,
                "total_expenses": total_expenses,
                "overspent_amount": calculated_overspent_amount
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/early-settlements-with-files")
async def create_early_settlement_with_files(
    cheque_id: int = Form(...),
    deposit_number: str = Form(""),
    deposit_amount: float = Form(...),
    deposit_date: str = Form(None),
    bank_deposit_reference: str = Form(""),
    notes: str = Form(""),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Create an early settlement for a cheque with mandatory file upload"""
    try:
        # Validate required files
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=400, 
                detail="At least one file attachment is required for early settlement. Please upload a deposit screenshot or bank statement."
            )
        
        # Validate required fields  
        if not all([cheque_id, deposit_amount]):
            raise HTTPException(status_code=400, detail="Cheque ID and deposit amount are required")
        
        if deposit_amount <= 0:
            raise HTTPException(status_code=400, detail="Deposit amount must be greater than 0")
        
        # Auto-generate deposit number if not provided
        if not deposit_number.strip():
            deposit_number = f"DEP-{cheque_id}-{int(time.time())}"
        
        # Verify cheque exists and is not settled
        cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.safe_id, c.is_settled, c.status
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id}).fetchone()
        
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        if cheque[4]:  # is_settled
            raise HTTPException(status_code=400, detail="Cheque is already settled")
        
        # Validate and process files (only safe formats for financial documents)
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ]
        max_size = 10 * 1024 * 1024  # 10MB
        
        uploaded_files = []
        
        for file in files:
            # Validate file type
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid file type: {file.filename}. Allowed types: JPG, PNG, GIF, WebP, PDF"
                )
            
            # Validate file size
            if file.size and file.size > max_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large: {file.filename}. Maximum size is 10MB"
                )
            
            # Ensure upload directory exists
            os.makedirs(EARLY_SETTLEMENT_UPLOAD_DIR, exist_ok=True)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
            unique_filename = f"settlement_{cheque_id}_{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(EARLY_SETTLEMENT_UPLOAD_DIR, unique_filename)
            
            # Save file to disk
            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                uploaded_files.append({
                    "original_filename": file.filename,
                    "saved_filename": unique_filename,
                    "file_path": file_path,
                    "file_size": len(content),
                    "mime_type": file.content_type
                })
            except Exception as e:
                # Clean up any previously saved files on error
                for prev_file in uploaded_files:
                    try:
                        os.remove(prev_file["file_path"])
                    except:
                        pass
                raise HTTPException(status_code=500, detail=f"Failed to save file {file.filename}: {str(e)}")
        
        # All files validated and saved, now create the settlement
        # Mark cheque as settled
        db.execute(text("""
            UPDATE cheques 
            SET is_settled = 1, 
                status = 'settled',
                settlement_date = CURRENT_TIMESTAMP
            WHERE id = :cheque_id
        """), {"cheque_id": cheque_id})
        
        # Add the deposited amount to the safe balance
        db.execute(text("""
            UPDATE safes 
            SET current_balance = current_balance + :amount
            WHERE id = :safe_id
        """), {
            "amount": float(deposit_amount),
            "safe_id": cheque[3]
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Early settlement created successfully for cheque {cheque[1]} with {len(uploaded_files)} file(s) uploaded",
            "settlement": {
                "cheque_id": cheque_id,
                "cheque_number": cheque[1],
                "deposit_number": deposit_number,
                "deposit_amount": deposit_amount,
                "deposit_date": deposit_date,
                "bank_deposit_reference": bank_deposit_reference,
                "notes": notes,
                "status": "approved",
                "files_uploaded": len(uploaded_files),
                "files": [
                    {
                        "original_filename": f["original_filename"],
                        "file_size": f["file_size"],
                        "mime_type": f["mime_type"]
                    }
                    for f in uploaded_files
                ]
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        # Clean up any uploaded files on error
        for uploaded_file in uploaded_files:
            try:
                os.remove(uploaded_file["file_path"])
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/early-settlements-simple")
async def create_early_settlement_simple(
    cheque_id: int = Form(...),
    deposit_number: str = Form(""),
    deposit_amount: float = Form(...),
    deposit_date: str = Form(None),
    bank_deposit_reference: str = Form(""),
    notes: str = Form(""),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Create an early settlement for a cheque with mandatory file upload (updated to require files)"""
    try:
        # Validate required files
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=400, 
                detail="At least one file attachment is required for early settlement. Please upload a deposit screenshot or bank statement."
            )
        
        # Validate required fields  
        if not all([cheque_id, deposit_amount]):
            raise HTTPException(status_code=400, detail="Cheque ID and deposit amount are required")
        
        if deposit_amount <= 0:
            raise HTTPException(status_code=400, detail="Deposit amount must be greater than 0")
        
        # Auto-generate deposit number if not provided
        if not deposit_number.strip():
            deposit_number = f"DEP-{cheque_id}-{int(time.time())}"
        
        # Verify cheque exists and is not settled
        cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.safe_id, c.is_settled, c.status
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id}).fetchone()
        
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        if cheque[4]:  # is_settled
            raise HTTPException(status_code=400, detail="Cheque is already settled")
        
        # Validate and process files (only safe formats for financial documents)  
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ]
        max_size = 10 * 1024 * 1024  # 10MB
        
        uploaded_files = []
        
        for file in files:
            # Validate file type
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid file type: {file.filename}. Allowed types: JPG, PNG, GIF, WebP, PDF"
                )
            
            # Validate file size
            if file.size and file.size > max_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large: {file.filename}. Maximum size is 10MB"
                )
            
            # Ensure upload directory exists
            os.makedirs(EARLY_SETTLEMENT_UPLOAD_DIR, exist_ok=True)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
            unique_filename = f"settlement_{cheque_id}_{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(EARLY_SETTLEMENT_UPLOAD_DIR, unique_filename)
            
            # Save file to disk
            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                uploaded_files.append({
                    "original_filename": file.filename,
                    "saved_filename": unique_filename,
                    "file_path": file_path,
                    "file_size": len(content),
                    "mime_type": file.content_type
                })
            except Exception as e:
                # Clean up any previously saved files on error
                for prev_file in uploaded_files:
                    try:
                        os.remove(prev_file["file_path"])
                    except:
                        pass
                raise HTTPException(status_code=500, detail=f"Failed to save file {file.filename}: {str(e)}")
        
        # All files validated and saved, now create the settlement
        # Mark cheque as settled
        db.execute(text("""
            UPDATE cheques 
            SET is_settled = 1, 
                status = 'settled',
                settlement_date = CURRENT_TIMESTAMP
            WHERE id = :cheque_id
        """), {"cheque_id": cheque_id})
        
        # Add the deposited amount to the safe balance
        db.execute(text("""
            UPDATE safes 
            SET current_balance = current_balance + :amount
            WHERE id = :safe_id
        """), {
            "amount": float(deposit_amount),
            "safe_id": cheque[3]
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Early settlement created successfully for cheque {cheque[1]} with {len(uploaded_files)} file(s) uploaded",
            "settlement": {
                "cheque_id": cheque_id,
                "cheque_number": cheque[1],
                "deposit_number": deposit_number,
                "deposit_amount": deposit_amount,
                "deposit_date": deposit_date,
                "bank_deposit_reference": bank_deposit_reference,
                "notes": notes,
                "status": "approved",
                "files_uploaded": len(uploaded_files),
                "files": [
                    {
                        "original_filename": f["original_filename"],
                        "file_size": f["file_size"],
                        "mime_type": f["mime_type"]
                    }
                    for f in uploaded_files
                ]
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        # Clean up any uploaded files on error
        for uploaded_file in uploaded_files:
            try:
                os.remove(uploaded_file["file_path"])
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/early-settlements-simple/{settlement_id}/approve")
async def approve_early_settlement_simple(
    settlement_id: int,
    approval_data: dict,
    db: Session = Depends(get_db)
):
    """Approve an early settlement (simplified - always returns success)"""
    return {
        "success": True,
        "message": f"Early settlement approved",
        "settlement_id": settlement_id
    }

@app.post("/early-settlements/{settlement_id}/upload")
async def upload_early_settlement_file(
    settlement_id: int,
    file: UploadFile = File(...),
    file_type: str = Form("deposit_screenshot"),
    db: Session = Depends(get_db)
):
    """Upload a file attachment for an early settlement"""
    try:
        # Validate file type (only safe formats for financial documents)
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: JPG, PNG, GIF, WebP, PDF"
            )
        
        # Validate file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 10MB limit"
            )
        
        # Check if early settlement exists
        settlement_check = db.execute(text("""
            SELECT id FROM early_settlements WHERE id = :settlement_id
        """), {"settlement_id": settlement_id}).fetchone()
        
        if not settlement_check:
            raise HTTPException(status_code=404, detail="Early settlement not found")
        
        # Ensure upload directory exists
        os.makedirs(EARLY_SETTLEMENT_UPLOAD_DIR, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(EARLY_SETTLEMENT_UPLOAD_DIR, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Save file record to database (simplified - just return success)
        # In a full implementation, you would save to early_settlement_files table
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_info": {
                "filename": unique_filename,
                "original_filename": file.filename,
                "file_size": len(content),
                "file_type": file_type,
                "mime_type": file.content_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

# ==========================================
# ARABIC CHEQUE PRINTING ENDPOINTS
# ==========================================

@app.post("/cheques/{cheque_id}/print-arabic")
async def print_existing_cheque_arabic(
    cheque_id: int,
    db: Session = Depends(get_db)
):
    """Print an existing cheque in Arabic format using the pre-uploaded template"""
    try:
        # Import the cheque generator
        from arabic_cheque_generator import generate_arabic_cheque
        
        # Get cheque data from database
        cheque_query = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.issue_date, c.due_date, c.description,
                   c.issued_to, s.name as safe_name, ba.account_name as bank_name
            FROM cheques c
            LEFT JOIN safes s ON c.safe_id = s.id  
            LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id})
        
        cheque_row = cheque_query.fetchone()
        if not cheque_row:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        # Extract cheque data and map to expected field names
        amount = float(cheque_row[2]) if cheque_row[2] else 0
        issue_date = cheque_row[3]
        due_date = cheque_row[4]
        
        # Format date properly
        if issue_date:
            if hasattr(issue_date, 'strftime'):
                date_str = issue_date.strftime("%Y-%m-%d")
            else:
                date_str = str(issue_date)
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
        
        if due_date:
            if hasattr(due_date, 'strftime'):
                due_date_str = due_date.strftime("%Y-%m-%d")
            else:
                due_date_str = str(due_date)
        else:
            due_date_str = datetime.now().strftime("%Y-%m-%d")
        
        cheque_data = {
            # Primary cheque fields - these are the fields the Arabic generator expects
            "beneficiary_name": cheque_row[6] or "غير محدد",  # Maps to issued_to
            "issued_to": cheque_row[6] or "غير محدد",  # Also include as issued_to for company table
            "amount_number": amount,
            "amount_numbers": str(int(amount)),  # For amount in digits field
            "cheque_number": cheque_row[1] or "",
            "date": date_str,
            "issue_date": date_str,
            "due_date": due_date_str,
            "note_1": "محرر الشيك",
            "note_2": "التاريخ",
            "note_3": "المستلم",
            "expense_id": "expense_id",
             # Include both date formats
            
            # Description and expense info - FIX: Use correct column index for description
            "expense_description": cheque_row[5] or f"شيك رقم {cheque_row[1]}",
            "description": cheque_row[5] or "",  # FIXED: Now uses correct index for description
            
            # New positioning fields
            "payee_notice": "يصرف للمستفيد الأول",
            "recipient": "مدير الشؤون المالية",  # FIXED: Use role instead of duplicate name
            "receipt_date": "تاريخ الاستلام",
            
            # Bank and safe info
            "safe_name": cheque_row[7] or "",
            "bank_name": cheque_row[8] or "",
            
            # Additional fields that might be used by company table
            "expense_number": f"CHQ-{cheque_row[1]}",
            "category_path": "شيكات > مدفوعات",
            "reference_number": f"REF-{cheque_row[1]}",
            "account_code": "ACC-4010",
            "server_date": datetime.now().strftime("%Y-%m-%d"),
            
            # Enable company table by default for cheques from Cheque Management
            "field_visibility": {
                "company_table": True,
                "beneficiary_name": True,
                "amount_numbers": True,
                "issued_to": True,
                "date": True,
                "cheque_number": True
            }
        }
        
        # Generate the cheque PDF
        pdf_bytes = generate_arabic_cheque(cheque_data)
        
        # Return PDF as inline response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=cheque_{cheque_row[1]}_arabic.pdf",
                "Content-Type": "application/pdf",
                "Cache-Control": "no-cache"
            }
        )
        
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="Arabic cheque generator not available. Please install required packages."
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail="Cheque template not found. Please upload a template first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to print cheque: {str(e)}")

@app.patch("/cheques/{cheque_id}/mark-printed")
async def mark_cheque_as_printed(
    cheque_id: int,
    db: Session = Depends(get_db)
):
    """Mark a cheque as printed and track print count"""
    try:
        # Check if cheque exists
        cheque = db.execute(text("SELECT id FROM cheques WHERE id = :id"), 
                           {"id": cheque_id}).fetchone()
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        # Update print status in database
        db.execute(text("""
            UPDATE cheques 
            SET is_printed = 1, 
                printed_at = NOW(),
                print_count = COALESCE(print_count, 0) + 1
            WHERE id = :cheque_id
        """), {"cheque_id": cheque_id})
        
        db.commit()
        
        return {"success": True, "message": "Cheque marked as printed"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update print status: {str(e)}")

@app.get("/cheques/printable")
async def get_printable_cheques(
    safe_id: Optional[int] = None,
    status: str = "issued",
    db: Session = Depends(get_db)
):
    """Get list of cheques that can be printed"""
    try:
        # Build query conditions
        where_conditions = ["c.status = :status"]
        params = {"status": status}
        
        if safe_id:
            where_conditions.append("c.safe_id = :safe_id")
            params["safe_id"] = safe_id
            
        where_clause = " AND ".join(where_conditions)
        
        # Get printable cheques
        result = db.execute(text(f"""
            SELECT c.id, c.cheque_number, c.amount, c.issue_date, c.due_date, c.description,
                   c.issued_to, s.name as safe_name, ba.account_name as bank_name,
                   c.status
            FROM cheques c
            LEFT JOIN safes s ON c.safe_id = s.id
            LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id  
            WHERE {where_clause}
            ORDER BY c.issue_date DESC, c.cheque_number DESC
        """), params)
        
        cheques = []
        for row in result:
            cheques.append({
                "id": row[0],
                "cheque_number": row[1],
                "amount": float(row[2]) if row[2] else 0,
                "issue_date": row[3].isoformat() if row[3] else None,
                "due_date": row[4].isoformat() if row[4] else None,  # Added due_date field
                "description": row[5] or "",
                "issued_to": row[6] or "",
                "safe_name": row[7] or "",
                "bank_name": row[8] or "",
                "status": row[9] or "issued"  # Updated index
            })
        
        return {
            "success": True,
            "cheques": cheques,
            "total": len(cheques)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch printable cheques: {str(e)}")

@app.post("/upload-cheque-template")
async def upload_cheque_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload cheque template PDF"""
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed for cheque templates")
        
        # Validate file size (5MB limit for templates)
        max_size = 5 * 1024 * 1024  # 5MB
        if file.size and file.size > max_size:
            raise HTTPException(status_code=400, detail="Template file size exceeds 5MB limit")
        
        # Ensure uploads directory exists
        uploads_dir = "uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Save template file
        template_path = os.path.join(uploads_dir, "cheque_template.pdf")
        with open(template_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "success": True,
            "message": "Cheque template uploaded successfully",
            "template_path": template_path,
            "file_size": len(content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload template: {str(e)}")

@app.get("/cheque-template-status")
async def check_cheque_template_status():
    """Check if cheque template is available"""
    template_path = "uploads/cheque_template.pdf"
    exists = os.path.exists(template_path)
    
    file_info = {}
    if exists:
        try:
            stat = os.stat(template_path)
            file_info = {
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
        except:
            pass
    
    return {
        "template_exists": exists,
        "template_path": template_path,
        "file_info": file_info
    }

# ==========================================
# HELPER ENDPOINTS FOR EDITING
# ==========================================

@app.get("/ingredients-for-editing")
async def get_ingredients_for_editing(db: Session = Depends(get_db)):
    """Get all ingredients in a simple format for recipe editing"""
    try:
        # Get all items that can be used as ingredients
        result = db.execute(text("""
            SELECT i.id, i.name, i.unit, i.price_per_unit,
                   COALESCE(c.name, 'Uncategorized') as category_name
            FROM items i
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            ORDER BY c.name ASC, i.name ASC
        """))
        
        ingredients = []
        for row in result:
            ingredients.append({
                "id": row[0],
                "name": row[1] or "Unknown Item",
                "unit": row[2] or "units",
                "price_per_unit": float(row[3]) if row[3] else 0.0,
                "category": row[4] or "Uncategorized"
            })
        
        return {
            "success": True,
            "count": len(ingredients),
            "data": ingredients
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.get("/sub-recipes-for-editing")
async def get_sub_recipes_for_editing(db: Session = Depends(get_db)):
    """Get all sub-recipes in a simple format for recipe editing"""
    try:
        sub_recipes = db.query(models.SubRecipe).all()
        
        result = []
        for sub_recipe in sub_recipes:
            result.append({
                "id": sub_recipe.id,
                "name": sub_recipe.name
            })
        
        return {
            "success": True,
            "count": len(result),
            "data": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.get("/sub-recipes-manage")
async def get_sub_recipes_manage(db: Session = Depends(get_db)):
    """Get all sub-recipes with full details for management interface"""
    try:
        sub_recipes = db.query(models.SubRecipe).all()
        
        result = []
        for sub_recipe in sub_recipes:
            # Get ingredients
            ingredients = []
            total_cost = 0
            for ing in sub_recipe.ingredients:
                item = db.query(models.Item).filter(models.Item.id == ing.ingredient_id).first()
                if item:
                    price_per_unit = float(item.price_per_unit) if item.price_per_unit else 0
                    ingredient_total_cost = price_per_unit * float(ing.quantity)
                    total_cost += ingredient_total_cost
                    ingredients.append({
                        "id": ing.ingredient_id,
                        "ingredient_name": item.name,
                        "name": item.name,
                        "quantity": float(ing.quantity),
                        "unit": item.unit,
                        "price_per_unit": price_per_unit,
                        "total_cost": ingredient_total_cost
                    })
            
            # Get nested sub-recipes
            nested_sub_recipes = []
            for nsr in sub_recipe.nested_sub_recipes:
                child = nsr.child_sub_recipe
                nested_sub_recipes.append({
                    "id": nsr.id,
                    "sub_recipe_id": child.id,
                    "sub_recipe_name": child.name,
                    "name": child.name,
                    "quantity": float(nsr.quantity)
                })
            
            result.append({
                "id": sub_recipe.id,
                "name": sub_recipe.name,
                "total_cost": total_cost,
                "ingredients": ingredients,
                "sub_recipes": nested_sub_recipes,
                "nested_sub_recipes": nested_sub_recipes  # Some components might use this name
            })
        
        return result
        
    except Exception as e:
        # Return empty array on error to prevent frontend crashes
        print(f"Error in /sub-recipes-manage: {str(e)}")
        return []

@app.get("/mid-prep-recipes-manage")
async def get_mid_prep_recipes_manage(db: Session = Depends(get_db)):
    """Get all mid-prep recipes with full details for management interface"""
    try:
        mid_prep_recipes = db.query(models.MidPrepRecipe).all()
        
        result = []
        for mid_prep in mid_prep_recipes:
            # Get ingredients
            ingredients = []
            total_cost = 0
            for ing in mid_prep.ingredients:
                item = db.query(models.Item).filter(models.Item.id == ing.ingredient_id).first()
                if item:
                    price_per_unit = float(item.price_per_unit) if item.price_per_unit else 0
                    ingredient_total_cost = price_per_unit * float(ing.quantity)
                    total_cost += ingredient_total_cost
                    ingredients.append({
                        "id": ing.ingredient_id,
                        "ingredient_name": item.name,
                        "name": item.name,
                        "quantity": float(ing.quantity),
                        "unit": item.unit,
                        "price_per_unit": price_per_unit,
                        "total_cost": ingredient_total_cost
                    })
            
            # Get sub-recipes
            sub_recipes = []
            if hasattr(mid_prep, 'subrecipes'):
                for sr in mid_prep.subrecipes:
                    sub_recipe = db.query(models.SubRecipe).filter(models.SubRecipe.id == sr.sub_recipe_id).first()
                    if sub_recipe:
                        sub_recipes.append({
                            "id": sr.sub_recipe_id,
                            "sub_recipe_name": sub_recipe.name,
                            "name": sub_recipe.name,
                            "quantity": float(sr.quantity)
                        })
            
            result.append({
                "id": mid_prep.id,
                "name": mid_prep.name,
                "total_cost": total_cost,
                "ingredients": ingredients,
                "sub_recipes": sub_recipes
            })
        
        return result
        
    except Exception as e:
        # Return empty array on error to prevent frontend crashes
        print(f"Error in /mid-prep-recipes-manage: {str(e)}")
        return []

@app.get("/cakes-manage")
async def get_cakes_manage(db: Session = Depends(get_db)):
    """Get all cakes with full details for management interface"""
    try:
        cakes = db.query(models.Cake).all()
        
        result = []
        for cake in cakes:
            # Get ingredients
            ingredients = []
            total_cost = 0
            for ing in cake.ingredients:
                if not ing.is_subrecipe:
                    item = db.query(models.Item).filter(models.Item.id == ing.ingredient_or_subrecipe_id).first()
                    if item:
                        price_per_unit = float(item.price_per_unit) if item.price_per_unit else 0
                        ingredient_cost = price_per_unit * float(ing.quantity)
                        total_cost += ingredient_cost
                        ingredients.append({
                            "id": ing.ingredient_or_subrecipe_id,
                            "name": item.name,
                            "quantity": float(ing.quantity),
                            "unit": item.unit,
                            "type": "ingredient",
                            "cost": ingredient_cost
                        })
            
            # Get sub-recipes
            sub_recipes = []
            for ing in cake.ingredients:
                if ing.is_subrecipe:
                    sub_recipe = db.query(models.SubRecipe).filter(models.SubRecipe.id == ing.ingredient_or_subrecipe_id).first()
                    if sub_recipe:
                        # Add sub-recipe to ingredients list for frontend compatibility
                        ingredients.append({
                            "id": ing.ingredient_or_subrecipe_id,
                            "name": sub_recipe.name,
                            "quantity": float(ing.quantity),
                            "type": "sub_recipe",
                            "cost": 0  # Will be calculated on frontend
                        })
                        sub_recipes.append({
                            "id": ing.ingredient_or_subrecipe_id,
                            "name": sub_recipe.name,
                            "quantity": float(ing.quantity)
                        })
            
            # Get mid-preps
            mid_preps = []
            for mp in cake.mid_preps:
                mid_prep = db.query(models.MidPrepRecipe).filter(models.MidPrepRecipe.id == mp.mid_prep_id).first()
                if mid_prep:
                    mid_preps.append({
                        "id": mp.mid_prep_id,
                        "name": mid_prep.name,
                        "quantity": float(mp.quantity),
                        "cost": 0  # Will be calculated on frontend
                    })
            
            result.append({
                "id": cake.id,
                "name": cake.name,
                "total_cost": total_cost,
                "percent_yield": float(cake.percent_yield) if cake.percent_yield else 100,
                "ingredients": ingredients,
                "sub_recipes": sub_recipes,
                "mid_preps": mid_preps
            })
        
        return result
        
    except Exception as e:
        # Return empty array on error to prevent frontend crashes
        print(f"Error in /cakes-manage: {str(e)}")
        return []

@app.get("/mid-preps-for-editing")
async def get_mid_preps_for_editing(db: Session = Depends(get_db)):
    """Get all mid-prep recipes in a simple format for recipe editing"""
    try:
        mid_preps = db.query(models.MidPrepRecipe).all()
        
        result = []
        for mid_prep in mid_preps:
            result.append({
                "id": mid_prep.id,
                "name": mid_prep.name
            })
        
        return {
            "success": True,
            "count": len(result),
            "data": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

# ==========================================
# WAREHOUSE ENDPOINTS (PERSISTENT IN-MEMORY STORAGE)
# ==========================================

# COMMENTED OUT: In-memory storage conflicts with database-based warehouse_api.py
# In-memory storage for warehouses (will persist during server session)
# warehouses_store = [
#     {"id": 1, "name": "Main Warehouse", "location": "Building A"},
#     {"id": 2, "name": "Secondary Warehouse", "location": "Building B"},
#     {"id": 3, "name": "Cold Storage", "location": "Building C"},
#     {"id": 4, "name": "Dry Storage", "location": "Building D"}
# ]

# def get_next_warehouse_id():
#     """Get the next available warehouse ID"""
#     return max([w["id"] for w in warehouses_store], default=0) + 1

@app.get("/api/warehouse/warehouses")
async def get_warehouses_simple(db: Session = Depends(get_db)):
    """Get warehouses - Returns current warehouse list from database with shop fields"""
    try:
        print("🔍 Fetching warehouses from database...")
        
        # Get warehouses from database with shop fields
        result = db.execute(text("""
            SELECT id, name, location, created_at, is_shop, foodics_branch_id, auto_sync
            FROM warehouses
            ORDER BY name
        """))
        
        print("✅ Query executed successfully")
        
        warehouses = []
        for row in result:
            print(f"Processing row: {row}")
            warehouse = {
                "id": row[0],
                "name": row[1],
                "location": row[2] or "",
                "created_at": row[3].isoformat() if row[3] else None
            }
            
            # Add shop fields if they exist
            if len(row) > 4:
                warehouse.update({
                    "is_shop": bool(row[4]) if row[4] is not None else False,
                    "foodics_branch_id": row[5],
                    "auto_sync": bool(row[6]) if row[6] is not None else True
                })
                print(f"Added shop fields: is_shop={warehouse['is_shop']}, foodics_branch_id={warehouse['foodics_branch_id']}")
            
            warehouses.append(warehouse)
        
        print(f"✅ Returning {len(warehouses)} warehouses with shop fields")
        return warehouses
        
    except Exception as e:
        print(f"❌ Error fetching warehouses: {str(e)}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch warehouses: {str(e)}")

# COMMENTED OUT: Conflicting with database-based warehouse_api.py
# @app.post("/api/warehouse/warehouses")
# async def create_warehouse_simple(
#     warehouse_data: dict,
#     db: Session = Depends(get_db)
# ):
#     """Create a new warehouse - Persists in memory"""
#     try:
#         # Extract warehouse data
#         name = warehouse_data.get("name", "").strip()
#         location = warehouse_data.get("location", "").strip()
#         
#         # Validate required fields
#         if not name:
#             raise HTTPException(status_code=400, detail="Warehouse name is required")
#         
#         # Check for duplicate names
#         if any(w["name"].lower() == name.lower() for w in warehouses_store):
#             raise HTTPException(status_code=400, detail="Warehouse name already exists")
#         
#         # Create the new warehouse object
#         new_warehouse = {
#             "id": get_next_warehouse_id(),
#             "name": name,
#             "location": location,
#             "created_at": "2024-01-15T10:00:00Z"
#         }
#         
#         # Add to storage
#         warehouses_store.append(new_warehouse)
#         
#         print(f"✅ Created new warehouse: {name} at {location} (ID: {new_warehouse['id']})")
#         
#         return {
#             "success": True,
#             "message": f"Warehouse '{name}' created successfully",
#             "data": new_warehouse
#         }
#         
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to create warehouse: {str(e)}")

# COMMENTED OUT: Conflicting with database-based warehouse_api.py
# @app.put("/api/warehouse/warehouses/{warehouse_id}")
# async def update_warehouse_simple(
#     warehouse_id: int,
#     warehouse_data: dict,
#     db: Session = Depends(get_db)
# ):
#     """Update an existing warehouse - Updates in memory"""
#     try:
#         # Extract warehouse data
#         name = warehouse_data.get("name", "").strip()
#         location = warehouse_data.get("location", "").strip()
#         
#         # Validate required fields
#         if not name:
#             raise HTTPException(status_code=400, detail="Warehouse name is required")
#         
#         # Find the warehouse to update
#         warehouse_to_update = None
#         for i, warehouse in enumerate(warehouses_store):
#             if warehouse["id"] == warehouse_id:
#                 warehouse_to_update = i
#                 break
#         
#         if warehouse_to_update is None:
#             raise HTTPException(status_code=404, detail="Warehouse not found")
#         
#         # Check for duplicate names (excluding current warehouse)
#         if any(w["name"].lower() == name.lower() and w["id"] != warehouse_id for w in warehouses_store):
#             raise HTTPException(status_code=400, detail="Warehouse name already exists")
#         
#         # Update the warehouse
#         warehouses_store[warehouse_to_update].update({
#             "name": name,
#             "location": location,
#             "updated_at": "2024-01-15T10:30:00Z"
#         })
#         
#         print(f"✅ Updated warehouse {warehouse_id}: {name} at {location}")
#         
#         return {
#             "success": True,
#             "message": f"Warehouse '{name}' updated successfully",
#             "data": warehouses_store[warehouse_to_update]
#         }
#         
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to update warehouse: {str(e)}")

# COMMENTED OUT: Conflicting with database-based warehouse_api.py
# @app.delete("/api/warehouse/warehouses/{warehouse_id}")
# async def delete_warehouse_simple(
#     warehouse_id: int,
#     db: Session = Depends(get_db)
# ):
#     """Delete a warehouse - Removes from memory"""
#     try:
#         # Find the warehouse to delete
#         warehouse_to_delete = None
#         for i, warehouse in enumerate(warehouses_store):
#             if warehouse["id"] == warehouse_id:
#                 warehouse_to_delete = i
#                 break
#         
#         if warehouse_to_delete is None:
#             raise HTTPException(status_code=404, detail="Warehouse not found")
#         
#         # Get warehouse name before deletion for the message
#         warehouse_name = warehouses_store[warehouse_to_delete]["name"]
#         
#         # Remove from storage
#         warehouses_store.pop(warehouse_to_delete)
#         
#         print(f"✅ Deleted warehouse {warehouse_id}: {warehouse_name}")
#         
#         return {
#             "success": True,
#             "message": f"Warehouse '{warehouse_name}' deleted successfully"
#         }
#         
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to delete warehouse: {str(e)}")

@app.get("/api/warehouse/categories")
async def get_warehouse_categories_simple(db: Session = Depends(get_db)):
    """Get warehouse categories - Simple version"""
    try:
        # Return sample category data with ingredient counts
        categories = [
            {
                "id": 1, 
                "name": "Raw Materials", 
                "description": "Basic ingredients and materials",
                "ingredient_count": 12,
                "created_at": "2024-01-10T10:00:00Z"
            },
            {
                "id": 2, 
                "name": "Finished Products", 
                "description": "Completed items ready for sale",
                "ingredient_count": 8,
                "created_at": "2024-01-11T14:30:00Z"
            },
            {
                "id": 3, 
                "name": "Packaging", 
                "description": "Boxes, bags, and packaging materials",
                "ingredient_count": 5,
                "created_at": "2024-01-12T09:15:00Z"
            },
            {
                "id": 4, 
                "name": "Equipment", 
                "description": "Tools and machinery",
                "ingredient_count": 0,
                "created_at": "2024-01-13T16:45:00Z"
            }
        ]
        
        return categories
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@app.get("/api/warehouse/warehouses/{warehouse_id}/stock")
async def get_warehouse_stock_simple(warehouse_id: int, db: Session = Depends(get_db)):
    """Get warehouse stock - Uses REAL data from warehouse_stock table"""
    try:
        # Get actual stock data from warehouse_stock table with real quantities
        result = db.execute(text("""
            SELECT ws.ingredient_id, i.name, i.unit, ws.quantity,
                   COALESCE(c.name, 'Uncategorized') as category_name, ws.warehouse_id
            FROM warehouse_stock ws
            JOIN items i ON ws.ingredient_id = i.id
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            WHERE ws.warehouse_id = :warehouse_id
            ORDER BY i.name
        """), {"warehouse_id": warehouse_id})
        
        stock_items = []
        for row in result:
            stock_items.append({
                "ingredient_id": row[0],
                "ingredient_name": row[1],
                "unit": row[2] or "units",
                "quantity": float(row[3]) if row[3] is not None else 0.0,  # REAL quantity from database
                "category_name": row[4] or "Uncategorized",
                "warehouse_id": row[5]
            })
        
        return stock_items
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock: {str(e)}")

@app.get("/api/warehouse/ingredients")
async def get_warehouse_ingredients_simple(db: Session = Depends(get_db)):
    """Get warehouse ingredients - Simple version"""
    try:
        # Get actual items from database
        result = db.execute(text("""
            SELECT i.id, i.name, i.unit, COALESCE(c.name, 'Uncategorized') as category_name
            FROM items i
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            ORDER BY i.name
        """))
        
        ingredients = []
        for row in result:
            ingredients.append({
                "id": row[0],
                "name": row[1],
                "unit": row[2] or "units",
                "category_name": row[3] or "Uncategorized"
            })
        
        return ingredients
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ingredients: {str(e)}")

@app.get("/api/warehouse/ingredients/low-stock/{source_warehouse_id}/{dest_warehouse_id}")
async def get_low_stock_items_simple(
    source_warehouse_id: int,
    dest_warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Get items with low stock that need replenishment - Simple version"""
    try:
        # Get actual items from database and simulate low stock logic
        result = db.execute(text("""
            SELECT i.id, i.name, i.unit, COALESCE(i.price_per_unit, 0) as price
            FROM items i
            ORDER BY i.name
            LIMIT 5
        """))
        
        low_stock_items = []
        for row in result:
            # Simulate low stock items that need replenishment
            low_stock_items.append({
                "ingredient_id": row[0],
                "ingredient_name": row[1],
                "unit": row[2] or "units",
                "dest_quantity": 5.0,  # Low quantity at destination
                "source_quantity": 50.0,  # Available at source
                "minimum_stock": 20.0,  # Minimum required
                "suggested_quantity": 15.0  # Suggested transfer amount
            })
        
        return low_stock_items
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch low stock items: {str(e)}")

@app.get("/api/batch/sessions")
async def get_batch_sessions_simple(db: Session = Depends(get_db)):
    """Get batch sessions - Simple version"""
    try:
        # Return sample batch sessions data
        sessions = [
            {"id": 1, "name": "Morning Batch", "status": "active", "date": "2024-01-15"},
            {"id": 2, "name": "Afternoon Batch", "status": "completed", "date": "2024-01-15"},
            {"id": 3, "name": "Evening Batch", "status": "pending", "date": "2024-01-15"}
        ]
        
        return sessions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch batch sessions: {str(e)}")

@app.get("/api/batch/cakes/search")
async def search_batch_cakes_simple(q: str = "", db: Session = Depends(get_db)):
    """Search batch cakes - Simple version"""
    try:
        # Return sample cake search results
        cakes = [
            {"id": 1, "name": "Chocolate Cake", "type": "cake", "category": "chocolate"},
            {"id": 2, "name": "Vanilla Cake", "type": "cake", "category": "vanilla"},
            {"id": 3, "name": "Strawberry Cake", "type": "cake", "category": "fruit"},
            {"id": 4, "name": "Black Forest Cake", "type": "cake", "category": "specialty"}
        ]
        
        # Simple search filter
        if q:
            cakes = [cake for cake in cakes if q.lower() in cake["name"].lower()]
        
        return cakes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search cakes: {str(e)}")

# NOTE: All kitchen endpoints have been moved to routers/kitchen_routes.py

# Missing warehouse transfer-template endpoints
@app.get("/api/warehouse/transfer-templates")
async def get_transfer_templates(db: Session = Depends(get_db)):
    """Get all transfer templates"""
    try:
        # Return sample templates for now - can be enhanced later with real database storage
        templates = [
            {
                "id": 1, 
                "name": "Daily Bakery Supplies",
                "description": "Regular daily transfer of bakery ingredients",
                "source_warehouse_id": 1,
                "target_warehouse_id": 2,
                "total_items": 5,
                "created_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": 2, 
                "name": "Weekly Dry Goods", 
                "description": "Weekly transfer of dry storage items",
                "source_warehouse_id": 1,
                "target_warehouse_id": 4,
                "total_items": 8,
                "created_at": "2024-01-14T14:30:00Z"
            }
        ]
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/warehouse/transfer-templates")
async def create_transfer_template(
    template_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new transfer template"""
    try:
        # For now, just return success with mock data
        template_id = 3  # Mock next ID
        
        return {
            "success": True,
            "message": "Transfer template created successfully",
            "template_id": template_id,
            "data": {
                "id": template_id,
                "name": template_data.get("template_name", "New Template"),
                "description": template_data.get("description", ""),
                "source_warehouse_id": template_data.get("source_warehouse_id"),
                "target_warehouse_id": template_data.get("target_warehouse_id"),
                "total_items": len(template_data.get("items", [])),
                "created_at": "2024-01-15T15:00:00Z"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/warehouse/transfer-templates/save")
async def save_transfer_template(
    template_data: dict,
    db: Session = Depends(get_db)
):
    """Save a new transfer template - alternative endpoint"""
    try:
        # For now, just return success with mock data
        template_id = 4  # Mock next ID
        
        return {
            "success": True,
            "message": f"Template '{template_data.get('template_name', 'Unnamed')}' saved successfully",
            "data": {
                "id": template_id,
                "template_name": template_data.get("template_name", "New Template"),
                "description": template_data.get("description", ""),
                "source_warehouse_id": template_data.get("source_warehouse_id"),
                "target_warehouse_id": template_data.get("target_warehouse_id"),
                "items": template_data.get("items", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/warehouse/transfer-templates/{template_id}/load")
async def load_transfer_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Load a specific transfer template"""
    try:
        # Get actual items from database for template items
        result = db.execute(text("""
            SELECT i.id, i.name, i.unit
            FROM items i
            ORDER BY i.name
            LIMIT 5
        """))
        
        template_items = []
        for row in result:
            template_items.append({
                "ingredient_id": row[0],
                "ingredient_name": row[1],
                "unit": row[2] or "kg",
                "suggested_quantity": 10.0  # Mock suggested quantity
            })
        
        # Mock template data
        template_data = {
            "id": template_id,
            "template_name": f"Template {template_id}",
            "description": f"Mock template description for template {template_id}",
            "source_warehouse_id": 1,
            "target_warehouse_id": 2,
            "items": template_items
        }
        
        return {
            "success": True,
            "data": template_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/api/warehouse/transfer-templates/{template_id}")
async def delete_transfer_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Delete a transfer template"""
    try:
        return {
            "success": True,
            "message": f"Transfer template {template_id} deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/warehouse/transfer-orders")
async def create_transfer_order_simple(
    order_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a transfer order - Simple version with authentication"""
    try:
        global transfer_order_counter
        
        # Generate new order ID
        transfer_order_id = len(transfer_orders_storage) + 1000
        transfer_order_counter = max(transfer_order_counter, transfer_order_id + 1)
        
        # Get warehouse names for display
        warehouses = {
            1: "Main Warehouse",
            2: "Storage Room A", 
            3: "Storage Room B",
            4: "Cold Storage"
        }
        
        # Create new transfer order
        new_order = {
            "id": transfer_order_id,
            "source_warehouse_id": order_data.get("source_warehouse_id"),
            "source_warehouse_name": warehouses.get(order_data.get("source_warehouse_id"), "Unknown Warehouse"),
            "target_warehouse_id": order_data.get("target_warehouse_id"),
            "target_warehouse_name": warehouses.get(order_data.get("target_warehouse_id"), "Unknown Warehouse"),
            "status": "pending",
            "items": order_data.get("items", []),
            "total_items": len(order_data.get("items", [])),
            "notes": order_data.get("notes", ""),
            "created_at": "2024-01-15T16:00:00Z",
            "created_by": "admin"
        }
        
        # Store the order
        transfer_orders_storage[transfer_order_id] = new_order
        
        print(f"✅ Created new transfer order {transfer_order_id} with status 'pending'")
        
        return {
            "success": True,
            "message": "Transfer order created successfully",
            "transfer_order_id": transfer_order_id,
            "data": new_order
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Simple (non-auth) warehouse manager assignments endpoints for the React UI -----------------
@app.get("/api/warehouse/warehouse-assignments")
async def get_warehouse_assignments_simple():
    """Return an empty list of assignments so the UI can render without requiring auth."""
    return []

@app.post("/api/warehouse/warehouse-assignments")
async def create_warehouse_assignment_simple(body: dict):
    """Mock creation endpoint – echoes payload with a fake id."""
    body = body or {}
    body.setdefault("id", 1)
    return {"success": True, "data": body}

@app.put("/api/warehouse/warehouse-assignments/{assignment_id}")
async def update_warehouse_assignment_simple(assignment_id: int, body: dict):
    """Mock update – returns the passed data."""
    return {"success": True, "id": assignment_id, "data": body}

@app.delete("/api/warehouse/warehouse-assignments/{assignment_id}")
async def delete_warehouse_assignment_simple(assignment_id: int):
    """Mock delete endpoint – always succeeds."""
    return {"success": True, "message": f"Assignment {assignment_id} deleted"}

# ------------------------------------------------------------------------------

# In-memory storage for transfer orders (in production, use database)
transfer_orders_storage = {}
transfer_order_counter = 1

@app.get("/api/warehouse/transfer-orders/pending/{warehouse_id}")
async def get_pending_transfer_orders(warehouse_id: int, db: Session = Depends(get_db)):
    """Get pending transfer orders for a warehouse"""
    try:
        # Get warehouse names for display
        warehouses = {
            1: "Main Warehouse",
            2: "Storage Room A", 
            3: "Storage Room B",
            4: "Cold Storage"
        }
        
        # If no orders in storage, initialize with sample data
        if not transfer_orders_storage:
            sample_orders = [
                {
                    "id": 1,
                    "source_warehouse_id": 1,
                    "source_warehouse_name": warehouses.get(1, "Unknown Warehouse"),
                    "target_warehouse_id": warehouse_id,
                    "target_warehouse_name": warehouses.get(warehouse_id, "Unknown Warehouse"),
                    "created_at": "2024-01-15T10:00:00Z",
                    "status": "pending",
                    "items": [
                        {"ingredient_id": 1, "ingredient_name": "Flour", "quantity": 10, "unit": "kg"},
                        {"ingredient_id": 2, "ingredient_name": "Sugar", "quantity": 5, "unit": "kg"}
                    ],
                    "total_items": 2,
                    "notes": "Regular weekly transfer"
                },
                {
                    "id": 2, 
                    "source_warehouse_id": 2,
                    "source_warehouse_name": warehouses.get(2, "Unknown Warehouse"),
                    "target_warehouse_id": warehouse_id,
                    "target_warehouse_name": warehouses.get(warehouse_id, "Unknown Warehouse"),
                    "created_at": "2024-01-15T14:30:00Z",
                    "status": "pending",
                    "items": [
                        {"ingredient_id": 3, "ingredient_name": "Butter", "quantity": 3, "unit": "kg"}
                    ],
                    "total_items": 1,
                    "notes": "Emergency transfer for urgent order"
                }
            ]
            
            # Initialize storage with sample orders
            for order in sample_orders:
                transfer_orders_storage[order["id"]] = order
        
        # Filter only pending orders for this warehouse
        pending_orders = []
        for order_id, order in transfer_orders_storage.items():
            if (order.get("target_warehouse_id") == warehouse_id and 
                order.get("status") == "pending"):
                pending_orders.append(order)
        
        return {"success": True, "data": pending_orders}
        
    except Exception as e:
        print(f"Error getting pending transfer orders: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/warehouse/transfer-orders")
async def get_all_transfer_orders(db: Session = Depends(get_db)):
    """Get all transfer orders for reports and logs"""
    try:
        # Return all orders from storage
        all_orders = list(transfer_orders_storage.values())
        
        return {"success": True, "data": all_orders}
        
    except Exception as e:
        print(f"Error getting transfer orders: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/warehouse/transfer-orders/received/{warehouse_id}")
async def get_received_transfer_orders(warehouse_id: int, db: Session = Depends(get_db)):
    """Get received transfer orders for a warehouse (for reports and logs)"""
    try:
        # Filter only received orders for this warehouse
        received_orders = []
        for order_id, order in transfer_orders_storage.items():
            if (order.get("target_warehouse_id") == warehouse_id and 
                order.get("status") == "received"):
                received_orders.append(order)
        
        return {"success": True, "data": received_orders}
        
    except Exception as e:
        print(f"Error getting received transfer orders: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/warehouse/transfer-orders/receive")
async def receive_transfer_order(receive_data: dict, db: Session = Depends(get_db)):
    """Receive a transfer order with item processing details"""
    try:
        transfer_order_id = receive_data.get("transfer_order_id")
        items = receive_data.get("items", [])
        waste_reason = receive_data.get("waste_reason")
        
        # Update the transfer order status to "received"
        if transfer_order_id in transfer_orders_storage:
            transfer_orders_storage[transfer_order_id]["status"] = "received"
            transfer_orders_storage[transfer_order_id]["received_at"] = "2024-01-15T15:00:00Z"
            transfer_orders_storage[transfer_order_id]["waste_reason"] = waste_reason
        
        # Process received items
        processed_items = []
        for item in items:
            processed_items.append({
                "ingredient_id": item.get("ingredient_id"),
                "accepted": item.get("accepted", 0),
                "returned": item.get("returned", 0),
                "wasted": item.get("wasted", 0),
                "processed_at": "2024-01-15T15:00:00Z"
            })
        
        result = {
            "transfer_order_id": transfer_order_id,
            "status": "received",
            "processed_items": processed_items,
            "waste_reason": waste_reason,
            "processed_at": "2024-01-15T15:00:00Z"
        }
        
        print(f"✅ Transfer order {transfer_order_id} marked as received and removed from pending list")
        
        return {"success": True, "message": f"Transfer order {transfer_order_id} received successfully", "data": result}
        
    except Exception as e:
        print(f"Error receiving transfer order: {e}")
        return {"success": False, "error": str(e)}

@app.put("/api/warehouse/transfer-orders/{order_id}/process")
async def process_transfer_order(order_id: int, processing_data: dict, db: Session = Depends(get_db)):
    """Process a transfer order (receive, reject, etc.)"""
    try:
        # Sample processing logic
        status = processing_data.get("status", "received")
        notes = processing_data.get("notes", "")
        
        # In a real implementation, you would:
        # 1. Update the transfer order status
        # 2. Update stock levels based on received quantities
        # 3. Handle waste/returns
        
        result = {
            "id": order_id,
            "status": status,
            "processed_at": "2024-01-15T15:00:00Z",
            "notes": notes
        }
        
        return {"success": True, "message": f"Transfer order {order_id} processed successfully", "data": result}
        
    except Exception as e:
        print(f"Error processing transfer order: {e}")
        return {"success": False, "error": str(e)}

# ==========================================
# SECURE FOODICS CONFIGURATION ENDPOINTS
# ==========================================

@app.post("/api/foodics/configure")
async def configure_foodics_credentials(
    api_token: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Configure Foodics API credentials (publicly accessible)
    """
    try:
        if not foodics_available:
            return {
                "success": False,
                "message": "Foodics service not available - basic mode only"
            }
        
        logger.info("🔐 Configuring new Foodics API token")
        
        foodics_service = SecureFoodicsService(db)
        
        # First verify the new token
        verification_result = await foodics_service.verify_token(api_token)
        if not verification_result.get("valid"):
            return {
                "success": False,
                "message": f"Invalid API token: {verification_result.get('error', 'Token verification failed')}"
            }
        
        # Store the verified token
        result = await foodics_service.store_credentials(api_token, "api_user")
        
        if result == "success":
            logger.info("✅ Foodics token configured successfully")
            return {
                "success": True,
                "message": "Foodics API token configured successfully",
                "business_name": verification_result.get("business_name"),
                "business_reference": verification_result.get("business_reference")
            }
        else:
            return {
                "success": False,
                "message": "Failed to store API token"
            }
            
    except HTTPException as e:
        logger.error(f"❌ Configuration error: {e.detail}")
        return {
            "success": False,
            "message": f"Configuration failed: {e.detail}"
        }
    except Exception as e:
        logger.error(f"❌ Error configuring Foodics: {str(e)}")
        return {
            "success": False,
            "message": f"Configuration failed: {str(e)}"
        }

@app.get("/api/foodics/status")
async def get_foodics_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the current Foodics configuration status
    """
    try:
        if not foodics_available:
            # Basic status check
            result = db.execute(text("SELECT COUNT(*) as count FROM foodics_tokens WHERE is_active = 1")).fetchone()
            token_count = result[0] if result else 0
            
            return {
                "configured": token_count > 0,
                "api_token_configured": token_count > 0,
                "mode": "basic",
                "service_available": False
            }
        
        foodics_service = SecureFoodicsService(db)
        status = await foodics_service.get_configuration_status()
        status["mode"] = "secure"
        status["service_available"] = True
        return status
        
    except Exception as e:
        logger.error(f"Error getting Foodics status: {str(e)}")
        return {
            "configured": False,
            "api_token_configured": False,
            "error": str(e),
            "service_available": foodics_available
        }

@app.post("/api/foodics/test-connection")
async def test_foodics_connection(
    db: Session = Depends(get_db)
):
    """
    Test the current Foodics API connection
    """
    try:
        if not foodics_available:
            return {
                "status": "limited",
                "message": "Foodics service not available - basic mode only",
                "branches": [],
                "account_info": {},
                "mode": "basic"
            }
        
        logger.info("🔗 DEBUG: Starting connection test")
        
        foodics_service = SecureFoodicsService(db)
        
        # Add debugging for token retrieval
        logger.info("🔗 DEBUG: Checking for active token...")
        token = await foodics_service.get_active_token()
        
        if not token:
            logger.error("🔗 DEBUG: No active token found")
            # Check if there are any tokens in the database at all
            try:
                result = db.execute(text("""
                    SELECT COUNT(*) as total_tokens, 
                           COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_tokens,
                           MAX(created_at) as last_token_date
                    FROM foodics_tokens
                """)).fetchone()
                
                if result:
                    total_tokens = result[0]
                    active_tokens = result[1] 
                    last_token_date = result[2]
                    
                    logger.info(f"🔗 DEBUG: Database check - Total tokens: {total_tokens}, Active tokens: {active_tokens}")
                    
                    return {
                        "status": "error",
                        "message": f"No active API token found. Database has {total_tokens} total tokens, {active_tokens} active tokens.",
                        "debug_info": {
                            "total_tokens": total_tokens,
                            "active_tokens": active_tokens,
                            "last_token_date": last_token_date.isoformat() if last_token_date else None
                        },
                        "mode": "debug"
                    }
                else:
                    return {
                        "status": "error", 
                        "message": "No tokens found in database",
                        "mode": "debug"
                    }
            except Exception as e:
                logger.error(f"🔗 DEBUG: Database check failed: {str(e)}")
                return {
                    "status": "error",
                    "message": f"Database check failed: {str(e)}",
                    "mode": "debug"
                }
        
        logger.info("🔗 DEBUG: Token found, testing connection...")
        
        # Test the connection and get basic info
        result = await foodics_service.test_connection()
        
        return {
            "status": "success",
            "message": "Connection successful",
            "branches": result.get("branches", []),
            "account_info": result.get("account_info", {}),
            "mode": "secure"
        }
        
    except HTTPException as e:
        logger.error(f"🔗 DEBUG: HTTPException in test_connection: {e.detail}")
        return {
            "status": "error",
            "message": f"Connection test failed: {e.detail}",
            "status_code": e.status_code,
            "mode": "debug"
        }
    except Exception as e:
        logger.error(f"🔗 DEBUG: Exception in test_connection: {str(e)}")
        return {
            "status": "error", 
            "message": f"Connection test failed: {str(e)}",
            "mode": "debug"
        }

@app.delete("/api/foodics/remove")
async def remove_foodics_configuration(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Remove Foodics configuration
    """
    try:
        foodics_service = SecureFoodicsService(db)
        await foodics_service.remove_configuration()
        
        return {"message": "Foodics configuration removed successfully"}
        
    except Exception as e:
        logger.error(f"Error removing Foodics configuration: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove configuration")

@app.get("/api/foodics/branches")
async def get_foodics_branches(
    db: Session = Depends(get_db)
    # current_user: models.User = Depends(get_current_active_user)  # Temporarily disabled for testing
):
    """Get all Foodics branches - Authentication temporarily disabled for testing"""
    try:
        logger.info("🔍 DEBUG: Getting branches (public endpoint)")
        logger.info(f"🔍 DEBUG: foodics_available = {foodics_available}")
        
        if not foodics_available:
            logger.warning("🔍 DEBUG: Foodics service not available - returning basic mode")
            return {
                "success": False, 
                "branches": [],
                "message": "Foodics service not available - basic mode only",
                "mode": "basic"
            }
        
        try:
            logger.info("🔍 DEBUG: Creating SecureFoodicsService instance")
            foodics_service = SecureFoodicsService(db)
            
            logger.info("🔍 DEBUG: Getting branches from Foodics API")
            branches = await foodics_service.get_branches()
            
            logger.info(f"🔍 DEBUG: Retrieved {len(branches)} branches")
            for i, branch in enumerate(branches[:3]):  # Log first 3 branches
                logger.info(f"🔍 DEBUG: Branch {i+1}: {branch.get('name', 'Unknown')} (ID: {branch.get('id', 'Unknown')})")
            
            return {"success": True, "branches": branches, "mode": "api", "total": len(branches)}
            
        except HTTPException as http_error:
            logger.error(f"🔍 DEBUG: HTTP Exception: {http_error.detail}")
            return {
                "success": False,
                "branches": [],
                "message": f"Foodics API error: {http_error.detail}",
                "mode": "error"
            }
        except Exception as service_error:
            logger.error(f"🔍 DEBUG: Service Exception: {str(service_error)}")
            logger.error(f"🔍 DEBUG: Service Exception type: {type(service_error).__name__}")
            import traceback
            logger.error(f"🔍 DEBUG: Service traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "branches": [],
                "message": f"Service error: {str(service_error)}",
                "mode": "error"
            }
        
    except Exception as e:
        logger.error(f"❌ DEBUG: Fatal error in get_foodics_branches: {str(e)}")
        logger.error(f"❌ DEBUG: Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ DEBUG: Full traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "branches": [],
            "message": f"Fatal error: {str(e)}",
            "mode": "error"
        }

# New Foodics product synchronization endpoints
@app.get("/api/foodics/products/{branch_id}")
async def get_foodics_products(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all products for a specific Foodics branch"""
    try:
        if not foodics_available:
            return {
                "success": False, 
                "products": [],
                "message": "Foodics service not available - basic mode only"
            }
        
        foodics_service = SecureFoodicsService(db)
        
        products = await foodics_service.get_branch_products(branch_id)
        return {"success": True, "products": products}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get products: {str(e)}")

@app.post("/api/foodics/sync-products/{branch_id}")
async def sync_foodics_products(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Sync products between Foodics and local warehouse system"""
    try:
        if not foodics_available:
            return {
                "success": False, 
                "message": "Foodics service not available - basic mode only",
                "details": {}
            }
        
        foodics_service = SecureFoodicsService(db)
        
        sync_result = await foodics_service.sync_products(branch_id)
        return {
            "success": True, 
            "message": "Product sync completed",
            "details": sync_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync products: {str(e)}")

@app.get("/api/foodics/fetch-sales/{shop_id}")
async def fetch_shop_sales_from_foodics(
    shop_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """SALES-FOCUSED: Fetch sales data from Foodics branch"""
    try:
        if not foodics_available:
            return {
                "success": False,
                "message": "Foodics service not available - basic mode only",
                "sales_data": []
            }
        
        foodics_service = FoodicsService(db)
        
        fetch_result = await foodics_service.fetch_branch_sales_data(shop_id, days)
        return fetch_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sales data: {str(e)}")

@app.get("/api/foodics/fetch-inventory/{shop_id}")
async def fetch_shop_inventory_from_foodics(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """MODIFIED: Now redirects to sales data - inventory fetching disabled"""
    try:
        if not foodics_available:
            return {
                "success": False,
                "message": "Foodics service not available - basic mode only",
                "mode": "SALES_ONLY"
            }
        
        foodics_service = FoodicsService(db)
        
        # Redirect to sales data instead
        fetch_result = await foodics_service.fetch_branch_sales_data(shop_id, 7)
        return fetch_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sales data: {str(e)}")

@app.post("/api/foodics/sync-inventory/{shop_id}")
async def sync_shop_inventory_with_foodics(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """MODIFIED: Now read-only - fetches inventory data from Foodics branch"""
    try:
        if not foodics_available:
            return {
                "success": False,
                "message": "Foodics service not available - basic mode only",
                "mode": "READ_ONLY"
            }
        
        foodics_service = FoodicsService(db)
        
        sync_result = await foodics_service.sync_shop_inventory(shop_id)
        return sync_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory: {str(e)}")

@app.get("/api/foodics/sales-data/{shop_id}")
async def get_foodics_sales_data(
    shop_id: int,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Fetch sales data from Foodics for revenue tracking"""
    try:
        if not foodics_available:
            return {
                "success": False,
                "message": "Foodics service not available - basic mode only",
                "sales_data": []
            }
        
        foodics_service = FoodicsService(db)
        
        sales_data = await foodics_service.fetch_sales_data(shop_id, start_date, end_date)
        return sales_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sales data: {str(e)}")

# Sales-Focused Foodics Integration Endpoints
@app.get("/api/foodics/branch/{branch_id}/inventory")
async def get_branch_inventory_direct(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """DISABLED: Inventory fetching disabled - sales-only mode"""
    return {
        "success": False,
        "message": "Inventory fetching disabled - sales-only mode enabled",
        "mode": "SALES_ONLY",
        "use_instead": f"/api/foodics/branch/{branch_id}/sales"
    }

@app.get("/api/foodics/branch/{branch_id}/sales")
async def get_branch_sales_direct(
    branch_id: str,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """READ-ONLY: Get sales data for a specific Foodics branch"""
    try:
        from foodics_service import SecureFoodicsService
        foodics_service = SecureFoodicsService(db)
        
        sales_data = await foodics_service.get_branch_sales(branch_id, start_date, end_date)
        return sales_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get branch sales: {str(e)}")

@app.post("/api/foodics/configure-branch")
async def configure_default_branch(
    branch_id: str = Form(...),
    branch_name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Configure default branch for direct integration"""
    try:
        if not foodics_available:
            # Basic branch configuration
            db.execute(text("""
                INSERT INTO api_configurations (config_key, config_value, config_type, description)
                VALUES ('foodics_default_branch_id', :branch_id, 'string', 'Default Foodics branch ID'),
                       ('foodics_default_branch_name', :branch_name, 'string', 'Default Foodics branch name')
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
            """), {
                "branch_id": branch_id,
                "branch_name": branch_name
            })
            db.commit()
            
            return {
                "success": True,
                "message": f"Default branch set to {branch_name}",
                "branch_id": branch_id,
                "branch_name": branch_name,
                "mode": "basic"
            }
        
        foodics_service = SecureFoodicsService(db)
        
        result = await foodics_service.store_branch_configuration(branch_id, branch_name)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure branch: {str(e)}")

@app.get("/api/foodics/default-branch/inventory")
async def get_default_branch_inventory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """DISABLED: Inventory fetching disabled - sales-only mode"""
    try:
        from foodics_service import SecureFoodicsService
        foodics_service = SecureFoodicsService(db)
        
        branch_id = await foodics_service.get_default_branch_id()
        
        return {
            "success": False,
            "message": "Inventory fetching disabled - sales-only mode enabled",
            "mode": "SALES_ONLY",
            "use_instead": f"/api/foodics/default-branch/sales" if branch_id else "Configure branch first at /api/foodics/configure-branch"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get default branch info: {str(e)}")

@app.get("/api/foodics/default-branch/sales")
async def get_default_branch_sales(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """READ-ONLY: Get sales data for the configured default branch"""
    try:
        from foodics_service import SecureFoodicsService
        foodics_service = SecureFoodicsService(db)
        
        branch_id = await foodics_service.get_default_branch_id()
        if not branch_id:
            raise HTTPException(status_code=400, detail="No default branch configured. Use /api/foodics/configure-branch first.")
        
        sales_data = await foodics_service.get_branch_sales(branch_id, start_date, end_date)
        return sales_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get default branch sales: {str(e)}")

# Foodics webhook endpoint for real-time updates (continuing integration)

# Foodics webhook endpoint for real-time updates
@app.post("/api/foodics/webhook")
async def foodics_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """Handle Foodics webhook notifications for real-time updates"""
    try:
        webhook_type = request.get("type")
        data = request.get("data", {})
        
        # Log webhook for debugging
        db.execute(text("""
            INSERT INTO foodics_webhook_logs (webhook_type, payload, received_at)
            VALUES (:type, :payload, NOW())
        """), {
            "type": webhook_type,
            "payload": json.dumps(data)
        })
        
        # Process different webhook types
        if webhook_type == "order.created":
            await process_order_webhook(data, db)
        elif webhook_type == "product.updated":
            await process_product_update_webhook(data, db)
        elif webhook_type == "inventory.updated":
            await process_inventory_webhook(data, db)
        
        db.commit()
        return {"success": True, "message": "Webhook processed successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

async def process_order_webhook(data: dict, db: Session):
    """Process new order webhook from Foodics"""
    # Implementation for processing new orders
    # Update local sales records, inventory impacts, etc.
    pass

async def process_product_update_webhook(data: dict, db: Session):
    """Process product update webhook from Foodics"""
    # Implementation for handling product changes
    # Update local product information, pricing, etc.
    pass

async def process_inventory_webhook(data: dict, db: Session):
    """Process inventory update webhook from Foodics"""
    # Implementation for handling inventory changes
    # Sync inventory levels with local warehouse
    pass

# Enhanced reporting endpoints
@app.get("/api/reports/inventory-summary")
async def get_inventory_summary_report(
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get comprehensive inventory summary report"""
    try:
        where_clauses = []
        params = {}
        
        if warehouse_id:
            where_clauses.append("ws.warehouse_id = :warehouse_id")
            params["warehouse_id"] = warehouse_id
            
        if category_id:
            where_clauses.append("i.category_id = :category_id")
            params["category_id"] = category_id
            
        where_clause = ""
        if where_clauses:
            where_clause = "WHERE " + " AND ".join(where_clauses)
        
        # Get inventory summary
        query = text(f"""
            SELECT 
                w.id as warehouse_id,
                w.name as warehouse_name,
                i.id as item_id,
                i.name as item_name,
                i.unit,
                ic.name as category_name,
                COALESCE(ws.quantity, 0) as current_stock,
                COALESCE(i.min_stock_level, 0) as min_stock_level,
                CASE 
                    WHEN COALESCE(ws.quantity, 0) <= COALESCE(i.min_stock_level, 0) THEN 'Low Stock'
                    WHEN COALESCE(ws.quantity, 0) = 0 THEN 'Out of Stock'
                    ELSE 'In Stock'
                END as stock_status,
                COALESCE(avg_cost.avg_price, 0) as average_cost,
                COALESCE(ws.quantity, 0) * COALESCE(avg_cost.avg_price, 0) as total_value
            FROM warehouses w
            CROSS JOIN items i
            LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id AND i.id = ws.ingredient_id
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            LEFT JOIN (
                SELECT poi.item_id, AVG(poi.unit_price) as avg_price
                FROM purchase_order_items poi
                JOIN purchase_orders po ON poi.purchase_order_id = po.id
                WHERE po.order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY poi.item_id
            ) avg_cost ON i.id = avg_cost.item_id
            {where_clause}
            ORDER BY w.name, ic.name, i.name
        """)
        
        if low_stock_only:
            query = text(f"""
                {query.text}
                HAVING stock_status IN ('Low Stock', 'Out of Stock')
            """)
        
        result = db.execute(query, params).fetchall()
        
        # Process results
        report_data = []
        total_value = 0
        
        for row in result:
            item_data = {
                "warehouse_id": row[0],
                "warehouse_name": row[1],
                "item_id": row[2],
                "item_name": row[3],
                "unit": row[4],
                "category_name": row[5] or "Uncategorized",
                "current_stock": float(row[6]),
                "min_stock_level": float(row[7]),
                "stock_status": row[8],
                "average_cost": float(row[9]),
                "total_value": float(row[10])
            }
            report_data.append(item_data)
            total_value += float(row[10])
        
        # Summary statistics
        summary = {
            "total_items": len(report_data),
            "total_inventory_value": total_value,
            "low_stock_items": len([item for item in report_data if item["stock_status"] == "Low Stock"]),
            "out_of_stock_items": len([item for item in report_data if item["stock_status"] == "Out of Stock"]),
            "in_stock_items": len([item for item in report_data if item["stock_status"] == "In Stock"])
        }
        
        return {
            "success": True,
            "summary": summary,
            "items": report_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@app.get("/api/reports/purchase-analysis")
async def get_purchase_analysis_report(
    supplier_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get purchase order analysis report"""
    try:
        where_clauses = ["po.status != 'Cancelled'"]
        params = {}
        
        if supplier_id:
            where_clauses.append("po.supplier_id = :supplier_id")
            params["supplier_id"] = supplier_id
            
        if start_date:
            where_clauses.append("po.order_date >= :start_date")
            params["start_date"] = start_date
            
        if end_date:
            where_clauses.append("po.order_date <= :end_date")
            params["end_date"] = end_date
        
        where_clause = "WHERE " + " AND ".join(where_clauses)
        
        # Get purchase analysis
        result = db.execute(text(f"""
            SELECT 
                s.id as supplier_id,
                s.name as supplier_name,
                COUNT(po.id) as total_orders,
                SUM(po.total_amount) as total_spent,
                AVG(po.total_amount) as average_order_value,
                COUNT(CASE WHEN po.status = 'Received' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN po.status = 'Pending' THEN 1 END) as pending_orders,
                MIN(po.order_date) as first_order_date,
                MAX(po.order_date) as last_order_date
            FROM suppliers s
            LEFT JOIN purchase_orders po ON s.id = po.supplier_id
            {where_clause}
            GROUP BY s.id, s.name
            HAVING total_orders > 0
            ORDER BY total_spent DESC
        """), params).fetchall()
        
        # Process results
        suppliers_analysis = []
        total_spent = 0
        total_orders = 0
        
        for row in result:
            supplier_data = {
                "supplier_id": row[0],
                "supplier_name": row[1],
                "total_orders": row[2] or 0,
                "total_spent": float(row[3]) if row[3] else 0,
                "average_order_value": float(row[4]) if row[4] else 0,
                "completed_orders": row[5] or 0,
                "pending_orders": row[6] or 0,
                "first_order_date": row[7].isoformat() if row[7] else None,
                "last_order_date": row[8].isoformat() if row[8] else None
            }
            suppliers_analysis.append(supplier_data)
            total_spent += supplier_data["total_spent"]
            total_orders += supplier_data["total_orders"]
        
        summary = {
            "total_suppliers": len(suppliers_analysis),
            "total_spent": total_spent,
            "total_orders": total_orders,
            "average_order_value": total_spent / total_orders if total_orders > 0 else 0
        }
        
        return {
            "success": True,
            "summary": summary,
            "suppliers": suppliers_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate purchase analysis: {str(e)}")

# Advanced search endpoints
@app.get("/api/search/global")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    search_type: Optional[str] = Query(None, description="Type: items, suppliers, orders, cheques"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Global search across all entities"""
    try:
        results = {"items": [], "suppliers": [], "purchase_orders": [], "cheques": []}
        search_term = f"%{q}%"
        
        if not search_type or search_type == "items":
            # Search items
            items = db.execute(text("""
                SELECT i.id, i.name, i.unit, ic.name as category_name,
                       COALESCE(SUM(ws.quantity), 0) as total_stock
                FROM items i
                LEFT JOIN inventory_categories ic ON i.category_id = ic.id
                LEFT JOIN warehouse_stock ws ON i.id = ws.ingredient_id
                WHERE i.name LIKE :search_term
                GROUP BY i.id, i.name, i.unit, ic.name
                LIMIT :limit
            """), {"search_term": search_term, "limit": limit}).fetchall()
            
            results["items"] = [
                {
                    "id": item[0],
                    "name": item[1],
                    "unit": item[2],
                    "category": item[3] or "Uncategorized",
                    "total_stock": float(item[4])
                }
                for item in items
            ]
        
        if not search_type or search_type == "suppliers":
            # Search suppliers
            suppliers = db.execute(text("""
                SELECT s.id, s.name, s.contact_name, s.phone,
                       COUNT(po.id) as total_orders
                FROM suppliers s
                LEFT JOIN purchase_orders po ON s.id = po.supplier_id
                WHERE s.name LIKE :search_term 
                   OR s.contact_name LIKE :search_term
                   OR s.phone LIKE :search_term
                GROUP BY s.id, s.name, s.contact_name, s.phone
                LIMIT :limit
            """), {"search_term": search_term, "limit": limit}).fetchall()
            
            results["suppliers"] = [
                {
                    "id": supplier[0],
                    "name": supplier[1],
                    "contact_name": supplier[2],
                    "phone": supplier[3],
                    "total_orders": supplier[4] or 0
                }
                for supplier in suppliers
            ]
        
        if not search_type or search_type == "orders":
            # Search purchase orders
            orders = db.execute(text("""
                SELECT po.id, s.name as supplier_name, po.order_date, 
                       po.status, po.total_amount
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                WHERE s.name LIKE :search_term
                   OR CAST(po.id AS CHAR) LIKE :search_term
                ORDER BY po.order_date DESC
                LIMIT :limit
            """), {"search_term": search_term, "limit": limit}).fetchall()
            
            results["purchase_orders"] = [
                {
                    "id": order[0],
                    "supplier_name": order[1],
                    "order_date": order[2].isoformat() if order[2] else None,
                    "status": order[3],
                    "total_amount": float(order[4]) if order[4] else 0
                }
                for order in orders
            ]
        
        if not search_type or search_type == "cheques":
            # Search cheques
            cheques = db.execute(text("""
                SELECT c.id, c.cheque_number, c.amount, c.status,
                       ba.account_name, ba.bank_name
                FROM cheques c
                LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
                WHERE c.cheque_number LIKE :search_term
                   OR c.description LIKE :search_term
                   OR ba.account_name LIKE :search_term
                LIMIT :limit
            """), {"search_term": search_term, "limit": limit}).fetchall()
            
            results["cheques"] = [
                {
                    "id": cheque[0],
                    "cheque_number": cheque[1],
                    "amount": float(cheque[2]) if cheque[2] else 0,
                    "status": cheque[3],
                    "bank_account": f"{cheque[4]} ({cheque[5]})" if cheque[4] else "Unknown"
                }
                for cheque in cheques
            ]
        
        # Count total results
        total_results = sum(len(results[key]) for key in results)
        
        return {
            "success": True,
            "query": q,
            "total_results": total_results,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Data export endpoints
@app.get("/api/export/inventory-csv")
async def export_inventory_csv(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Export inventory data as CSV"""
    try:
        import csv
        import io
        
        where_clause = ""
        params = {}
        
        if warehouse_id:
            where_clause = "WHERE w.id = :warehouse_id"
            params["warehouse_id"] = warehouse_id
        
        # Get inventory data
        result = db.execute(text(f"""
            SELECT 
                w.name as warehouse_name,
                i.name as item_name,
                i.unit,
                ic.name as category_name,
                COALESCE(ws.quantity, 0) as current_stock,
                COALESCE(i.min_stock_level, 0) as min_stock_level
            FROM warehouses w
            CROSS JOIN items i
            LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id AND i.id = ws.ingredient_id
            LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            {where_clause}
            ORDER BY w.name, ic.name, i.name
        """), params).fetchall()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "Warehouse", "Item Name", "Unit", "Category", 
            "Current Stock", "Min Stock Level"
        ])
        
        # Data rows
        for row in result:
            writer.writerow([
                row[0], row[1], row[2], row[3] or "Uncategorized",
                float(row[4]), float(row[5])
            ])
        
        # Return CSV as response
        csv_data = output.getvalue()
        output.close()
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=inventory_export.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

# Create necessary database tables for new features
# Removed table creation code to avoid clutter
# Tables can be created manually using create_foodics_tables.py or fix_tables.sql if needed

# Foodics endpoints configuration complete

@app.get("/api/foodics/whoami")
async def get_foodics_business_info(db: Session = Depends(get_db)):
    """Public endpoint: returns Foodics business information using /whoami"""
    try:
        foodics_service = SecureFoodicsService(db)
        token = await foodics_service.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active Foodics API token found")
        from foodics_service import foodics_service as fs
        result = await fs.get_whoami(token)
        if result.get("success"):
            return {
                "success": True,
                "business_info": result.get("business_info"),
                "business_name": result.get("business_name"),
                "business_reference": result.get("business_reference"),
                "user_info": result.get("user_info"),
                "recommended_scopes": fs.recommended_scopes
            }
        else:
            raise HTTPException(status_code=400, detail=f"Failed to get business info: {result.get('error')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting business info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get business information")

# ----------------- Cheque field position persistence -----------------

@app.get("/cheque-field-positions")
async def get_cheque_field_positions(db: Session = Depends(get_db)):
    """Return saved default field positions if any (stored in api_configurations)."""
    try:
        result = db.execute(text("""
            SELECT config_value FROM api_configurations
            WHERE config_key = 'cheque_field_positions'
        """)).fetchone()
        if result:
            import json
            return {"success": True, "positions": json.loads(result[0])}
        return {"success": True, "positions": {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cheque-field-positions")
async def save_cheque_field_positions(positions: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Persist default cheque field positions (overwrites existing)."""
    import json
    try:
        db.execute(text("""
            INSERT INTO api_configurations (config_key, config_value, description)
            VALUES ('cheque_field_positions', :val, 'Default PDF field coordinates for cheques')
            ON DUPLICATE KEY UPDATE config_value = :val, updated_at = NOW()
        """), {"val": json.dumps(positions)})
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Add API endpoints for frontend compatibility
from fastapi import APIRouter
api_router = APIRouter(prefix="/api", tags=["API"])

@api_router.get("/safes")
async def get_safes_api(db: Session = Depends(get_db)):
    """Get safes - API endpoint for frontend"""
    try:
        result = db.execute(text("""
            SELECT id, name, current_balance, is_active, created_at
            FROM safes 
            WHERE is_active = 1
            ORDER BY name ASC
        """))
        
        safes = []
        for row in result:
            safes.append({
                "id": row[0],
                "name": row[1] or "Unknown Safe",
                "current_balance": float(row[2]) if row[2] else 0.0,
                "is_active": bool(row[3]),
                "created_at": row[4].isoformat() if row[4] else None
            })
        
        return {
            "success": True,
            "count": len(safes),
            "data": safes
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@api_router.get("/expense-categories-simple")
async def get_expense_categories_api(db: Session = Depends(get_db)):
    """Get expense categories - API endpoint for frontend"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, parent_id, is_active
            FROM expense_categories 
            WHERE is_active = 1
            ORDER BY name ASC
        """))
        
        categories = []
        for row in result:
            categories.append({
                "id": row[0],
                "name": row[1] or "Unknown Category",
                "description": row[2] or "",
                "parent_id": row[3],
                "is_active": bool(row[4])
            })
        
        return {
            "success": True,
            "count": len(categories),
            "data": categories
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@api_router.get("/expenses/cheques")
async def get_cheques_for_expenses_simple(db: Session = Depends(get_db)):
    """Get all cheques with their expense counts for filtering (no authentication required)"""
    try:
        result = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.description, c.issue_date,
                   s.name as safe_name, COUNT(e.id) as expense_count,
                   COALESCE(SUM(e.amount), 0) as total_expenses
            FROM cheques c
            LEFT JOIN safes s ON c.safe_id = s.id
            LEFT JOIN expenses e ON c.id = e.cheque_id
            GROUP BY c.id, c.cheque_number, c.amount, c.description, c.issue_date, s.name
            ORDER BY c.issue_date DESC, c.id DESC
        """))
        
        cheques = []
        for row in result:
            cheques.append({
                "id": row[0],
                "cheque_number": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "description": row[3] or "",
                "issue_date": row[4].isoformat() if row[4] else None,
                "safe_name": row[5] or "Unknown Safe",
                "expense_count": row[6] or 0,
                "total_expenses": float(row[7]) if row[7] else 0.0
            })
        
        return {
            "success": True,
            "count": len(cheques),
            "data": cheques
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@api_router.get("/expenses/search")
async def search_expenses_simple(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    cheque_id: Optional[int] = None,
    cheque_number: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    safe_id: Optional[int] = None,
    search_term: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Search expenses with filters (no authentication required)"""
    try:
        # Build dynamic query
        where_conditions = []
        params = {}
        
        # Date range filter
        if from_date:
            where_conditions.append("e.expense_date >= :from_date")
            params["from_date"] = from_date
        if to_date:
            where_conditions.append("e.expense_date <= :to_date")
            params["to_date"] = to_date
        
        # Cheque filters
        if cheque_id:
            where_conditions.append("e.cheque_id = :cheque_id")
            params["cheque_id"] = cheque_id
        if cheque_number:
            where_conditions.append("c.cheque_number LIKE :cheque_number")
            params["cheque_number"] = f"%{cheque_number}%"
        
        # Other filters
        if category_id:
            where_conditions.append("e.category_id = :category_id")
            params["category_id"] = category_id
        if status:
            where_conditions.append("e.status = :status")
            params["status"] = status
        if safe_id:
            where_conditions.append("e.safe_id = :safe_id")
            params["safe_id"] = safe_id
        if search_term:
            where_conditions.append("(e.description LIKE :search_term OR e.notes LIKE :search_term)")
            params["search_term"] = f"%{search_term}%"
        
        # Build WHERE clause
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Set limit
        params["limit"] = limit
        
        result = db.execute(text(f"""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, e.notes,
                   ec.name as category_name, s.name as safe_name, c.cheque_number,
                   e.cheque_id, e.category_id, e.safe_id
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            LEFT JOIN cheques c ON e.cheque_id = c.id
            {where_clause}
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT :limit
        """), params)
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "notes": row[5] or "",
                "category_name": row[6] or "Uncategorized",
                "safe_name": row[7] or "Unknown Safe",
                "cheque_number": row[8] or "",
                "cheque_id": row[9],
                "category_id": row[10],
                "safe_id": row[11]
            })
        
        return {
            "success": True,
            "count": len(expenses),
            "data": expenses
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@api_router.post("/expenses/summary/html")
async def generate_expense_summary_html_simple(
    request_data: dict,
    language: str = "ar",
    db: Session = Depends(get_db)
):
    """Generate HTML summary for selected expenses (no authentication required)"""
    try:
        expense_ids = request_data.get("expense_ids", [])
        summary_info = request_data.get("summary_info", {})
        
        if not expense_ids:
            return {"success": False, "error": "No expenses selected"}
        
        # Get expenses data
        result = db.execute(text("""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, e.notes,
                   ec.name as category_name, s.name as safe_name, c.cheque_number
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            LEFT JOIN cheques c ON e.cheque_id = c.id
            WHERE e.id IN ({})
            ORDER BY e.expense_date DESC
        """.format(','.join(map(str, expense_ids)))))
        
        expenses = []
        total_amount = 0
        for row in result:
            expense = {
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "notes": row[5] or "",
                "category_name": row[6] or "Uncategorized",
                "safe_name": row[7] or "Unknown Safe",
                "cheque_number": row[8] or ""
            }
            expenses.append(expense)
            total_amount += expense["amount"]
        
        # Generate HTML (simplified version)
        html_content = f"""
        <!DOCTYPE html>
        <html lang="{language}">
        <head>
            <meta charset="UTF-8">
            <title>Expense Summary</title>
            <style>
                body {{ font-family: Arial, sans-serif; direction: {'rtl' if language == 'ar' else 'ltr'}; }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .summary {{ background: #f5f5f5; padding: 15px; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: {'right' if language == 'ar' else 'left'}; }}
                th {{ background-color: #28a745; color: white; }}
                .total {{ font-weight: bold; background-color: #e9ecef; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{'ملخص المصروفات' if language == 'ar' else 'Expense Summary'}</h1>
                <p>{'التاريخ' if language == 'ar' else 'Date'}: {summary_info.get('date_range', 'All Dates')}</p>
            </div>
            
            <div class="summary">
                <p><strong>{'العدد الإجمالي' if language == 'ar' else 'Total Count'}:</strong> {len(expenses)}</p>
                <p><strong>{'المبلغ الإجمالي' if language == 'ar' else 'Total Amount'}:</strong> ${total_amount:,.2f}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>{'الوصف' if language == 'ar' else 'Description'}</th>
                        <th>{'المبلغ' if language == 'ar' else 'Amount'}</th>
                        <th>{'التاريخ' if language == 'ar' else 'Date'}</th>
                        <th>{'الفئة' if language == 'ar' else 'Category'}</th>
                        <th>{'الخزنة' if language == 'ar' else 'Safe'}</th>
                        <th>{'رقم الشيك' if language == 'ar' else 'Cheque Number'}</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for expense in expenses:
            html_content += f"""
                    <tr>
                        <td>{expense['description']}</td>
                        <td>${expense['amount']:,.2f}</td>
                        <td>{expense['expense_date']}</td>
                        <td>{expense['category_name']}</td>
                        <td>{expense['safe_name']}</td>
                        <td>{expense['cheque_number']}</td>
                    </tr>
            """
        
        html_content += f"""
                    <tr class="total">
                        <td><strong>{'الإجمالي' if language == 'ar' else 'Total'}</strong></td>
                        <td><strong>${total_amount:,.2f}</strong></td>
                        <td colspan="4"></td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
        """
        
        return Response(content=html_content, media_type="text/html")
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/expenses/summary/download")
async def download_expense_summary_html_simple(
    request_data: dict,
    language: str = "ar",
    db: Session = Depends(get_db)
):
    """Download HTML summary for selected expenses (no authentication required)"""
    try:
        # Reuse the HTML generation logic
        html_response = await generate_expense_summary_html_simple(request_data, language, db)
        
        if isinstance(html_response, Response):
            # Return as file download
            return Response(
                content=html_response.body,
                media_type="text/html",
                headers={
                    "Content-Disposition": f"attachment; filename=expense_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                }
            )
        else:
            return html_response
            
    except Exception as e:
        return {"success": False, "error": str(e)}

app.include_router(api_router)

# Add this endpoint after the existing cheque endpoints

@app.post("/cheques/{cheque_id}/upload-supplier-invoice")
async def upload_supplier_invoice(
    cheque_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Upload supplier invoice for a supplier payment cheque"""
    
    # Get the cheque
    cheque = db.query(models.Cheque).filter(models.Cheque.id == cheque_id).first()
    if not cheque:
        raise HTTPException(status_code=404, detail="Cheque not found")
    
    # Verify it's a supplier payment cheque
    if not cheque.is_supplier_payment:
        raise HTTPException(status_code=400, detail="This cheque is not a supplier payment")
    
    # Verify cheque is in the correct status for invoice upload
    # The cheque should have status 'settled_pending_invoice' to upload invoice
    if cheque.status != 'settled_pending_invoice':
        if cheque.status == 'settled':
            raise HTTPException(status_code=400, detail="Invoice already uploaded and cheque is fully settled")
        else:
            raise HTTPException(status_code=400, detail=f"Cheque must be in 'settled_pending_invoice' status to upload invoice. Current status: {cheque.status}")
    
    # Check if invoice is already uploaded
    if cheque.supplier_invoice_uploaded:
        raise HTTPException(status_code=400, detail="Invoice already uploaded for this cheque")
    
    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and image files are allowed")
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/supplier_invoices"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
        unique_filename = f"invoice_cheque_{cheque_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update cheque record
        cheque.supplier_invoice_uploaded = True
        cheque.supplier_invoice_file_path = file_path
        cheque.supplier_invoice_upload_date = datetime.now()
        cheque.supplier_invoice_uploaded_by = current_user.id
        
        # Update status to 'settled' now that invoice is uploaded
        cheque.status = 'settled'
        
        db.commit()
        
        return {
            "success": True,
            "message": "Supplier invoice uploaded successfully",
            "file_path": file_path,
            "cheque_status": cheque.status
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/cheques/{cheque_id}/supplier-invoice")
async def get_supplier_invoice(
    cheque_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Download supplier invoice for a cheque"""
    
    # Get the cheque
    cheque = db.query(models.Cheque).filter(models.Cheque.id == cheque_id).first()
    if not cheque:
        raise HTTPException(status_code=404, detail="Cheque not found")
    
    # Check if invoice exists
    if not cheque.supplier_invoice_uploaded or not cheque.supplier_invoice_file_path:
        raise HTTPException(status_code=404, detail="No invoice uploaded for this cheque")
    
    # Check if file exists
    if not os.path.exists(cheque.supplier_invoice_file_path):
        raise HTTPException(status_code=404, detail="Invoice file not found on server")
    
    # Determine media type
    file_extension = cheque.supplier_invoice_file_path.split('.')[-1].lower()
    media_type_map = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
    }
    media_type = media_type_map.get(file_extension, 'application/octet-stream')
    
    return FileResponse(
        path=cheque.supplier_invoice_file_path,
        media_type=media_type,
        filename=f"invoice_cheque_{cheque_id}.{file_extension}"
    )

@app.get("/cheques/supplier-payments/pending-invoice")
async def get_supplier_payments_pending_invoice(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all supplier payment cheques that are settled but awaiting invoice upload"""
    
    cheques = db.query(models.Cheque).filter(
        models.Cheque.is_supplier_payment == True,
        models.Cheque.is_settled == True,
        models.Cheque.supplier_invoice_uploaded == False
    ).options(
        joinedload(models.Cheque.bank_account),
        joinedload(models.Cheque.safe)
    ).all()
    
    result = []
    for cheque in cheques:
        # Get associated purchase order
        po = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.payment_cheque_id == cheque.id
        ).first()
        
        result.append({
            "cheque_id": cheque.id,
            "cheque_number": cheque.cheque_number,
            "amount": float(cheque.amount),
            "issued_to": cheque.issued_to,
            "issue_date": cheque.issue_date.isoformat() if cheque.issue_date else None,
            "bank_account": cheque.bank_account.account_name if cheque.bank_account else None,
            "safe_name": cheque.safe.name if cheque.safe else None,
            "purchase_order_id": po.id if po else None,
            "supplier_name": po.supplier.name if po and po.supplier else cheque.issued_to,
            "days_since_payment": (datetime.now() - cheque.settlement_date).days if cheque.settlement_date else 0,
            "status": cheque.supplier_payment_status
        })
    
    return {
        "success": True,
        "count": len(result),
        "data": result
    }

@app.get("/cheques/{cheque_id}/settlement-attachments/{filename}")
async def get_settlement_attachment(
    cheque_id: int,
    filename: str,
    db: Session = Depends(get_db)
):
    """Download a settlement attachment file"""
    try:
        # Verify cheque exists and is settled
        cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.is_settled 
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id}).fetchone()
        
        if not cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
            
        if not cheque[2]:  # is_settled
            raise HTTPException(status_code=400, detail="Cheque is not settled")
        
        # Construct file path
        file_path = os.path.join(EARLY_SETTLEMENT_UPLOAD_DIR, filename)
        
        # Security check - ensure filename starts with correct pattern
        if not filename.startswith(f"settlement_{cheque_id}_"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Attachment file not found")
        
        # Determine content type based on file extension
        content_type_map = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        
        file_ext = os.path.splitext(filename)[1].lower()
        content_type = content_type_map.get(file_ext, 'application/octet-stream')
        
        # Read and return file
        with open(file_path, "rb") as file:
            content = file.read()
        
        # Extract original filename for better display
        original_name = filename.split('_', 3)[-1] if '_' in filename else filename
        
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename=\"{original_name}\"",
                "Content-Type": content_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving attachment: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🔗 Always using MySQL database: bakery_react on localhost:3306")
    uvicorn.run(app, host="0.0.0.0", port=8000)