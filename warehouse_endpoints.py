from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import pandas as pd
from datetime import datetime
from io import BytesIO
import json

from database import get_db
from auth import get_current_active_user
import models
import schemas

router = APIRouter(prefix="/api/warehouse", tags=["warehouse"])

# ==========================================
# WAREHOUSE MODELS AND SCHEMAS
# ==========================================

from pydantic import BaseModel
from decimal import Decimal

class TransferOrderCreate(BaseModel):
    source_warehouse_id: int
    target_warehouse_id: int
    items: List[dict]  # [{"ingredient_id": int, "quantity": float}]

class TransferOrderItem(BaseModel):
    ingredient_id: int
    ingredient_name: str
    quantity: float
    unit: str
    accepted_qty: Optional[float] = None
    returned_qty: Optional[float] = None
    wasted_qty: Optional[float] = None

class TransferOrder(BaseModel):
    id: int
    source_warehouse_id: int
    target_warehouse_id: int
    source_warehouse_name: str
    target_warehouse_name: str
    status: str
    created_at: datetime
    items: List[TransferOrderItem] = []

class ReceiveTransferRequest(BaseModel):
    transfer_order_id: int
    items: List[dict]  # [{"ingredient_id": int, "accepted": float, "returned": float, "wasted": float}]
    waste_reason: Optional[str] = None

class StockUpdateRequest(BaseModel):
    warehouse_id: int
    ingredient_id: int
    new_quantity: float
    reason: str
    category_id: Optional[int] = None

class CategoryCreate(BaseModel):
    name: str

class CategoryUpdate(BaseModel):
    name: str

# ==========================================
# WAREHOUSE ENDPOINTS
# ==========================================

@router.get("/warehouses")
async def get_warehouses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get warehouses accessible to the current user"""
    
    # Admin can see all warehouses
    if current_user.role.name == "Admin":
        warehouses = db.execute(text("SELECT id, name FROM warehouses ORDER BY name")).fetchall()
        return [{"id": w[0], "name": w[1]} for w in warehouses]
    
    # Get user's assigned warehouses
    assigned_warehouses = db.execute(text("""
        SELECT w.id, w.name 
        FROM warehouses w
        INNER JOIN warehouse_manager_assignments wma ON w.id = wma.warehouse_id
        WHERE wma.user_id = :user_id
        ORDER BY w.name
    """), {"user_id": current_user.id}).fetchall()
    
    return [{"id": w[0], "name": w[1]} for w in assigned_warehouses]

@router.get("/warehouses/{warehouse_id}/stock")
async def get_warehouse_stock(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get stock for a specific warehouse"""
    
    # Check if user has permission to view this warehouse's stock
    permissions = get_user_warehouse_permissions(current_user, warehouse_id, db)
    if not permissions["can_view_stock"]:
        raise HTTPException(status_code=403, detail="You don't have permission to view this warehouse's stock")
    
    stock_query = text("""
        SELECT i.id, i.name, i.unit, COALESCE(ws.quantity, 0) as quantity,
               ic.name as category_name
        FROM items i
        LEFT JOIN warehouse_stock ws ON i.id = ws.ingredient_id AND ws.warehouse_id = :warehouse_id
        LEFT JOIN inventory_categories ic ON i.category_id = ic.id
        ORDER BY i.name
    """)
    
    stock = db.execute(stock_query, {"warehouse_id": warehouse_id}).fetchall()
    return [
        {
            "ingredient_id": s[0],
            "ingredient_name": s[1],
            "unit": s[2],
            "quantity": float(s[3]),
            "category_name": s[4] or "Uncategorized"
        }
        for s in stock
    ]

# ==========================================
# TRANSFER ORDER ENDPOINTS
# ==========================================

@router.post("/transfer-orders", response_model=dict)
async def create_transfer_order(
    order_data: TransferOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new transfer order"""
    
    # Check if user has permission to create transfers from source warehouse
    source_permissions = get_user_warehouse_permissions(current_user, order_data.source_warehouse_id, db)
    if not source_permissions["can_create_transfers_out"]:
        raise HTTPException(status_code=403, detail="You don't have permission to create transfers from this warehouse")
    
    if order_data.source_warehouse_id == order_data.target_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination cannot be the same")
    
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Transfer order must contain at least one item")
    
    try:
        # Validate stock availability
        for item in order_data.items:
            stock_check = db.execute(text("""
                SELECT COALESCE(quantity, 0) 
                FROM warehouse_stock 
                WHERE ingredient_id = :ingredient_id AND warehouse_id = :warehouse_id
            """), {
                "ingredient_id": item["ingredient_id"],
                "warehouse_id": order_data.source_warehouse_id
            }).fetchone()
            
            available = float(stock_check[0]) if stock_check else 0
            if available < item["quantity"]:
                ingredient_name = db.execute(text("SELECT name FROM items WHERE id = :id"), 
                                           {"id": item["ingredient_id"]}).fetchone()[0]
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for {ingredient_name}: needed {item['quantity']}, available {available}"
                )
        
        # Create transfer order
        result = db.execute(text("""
            INSERT INTO transfer_orders (source_warehouse_id, target_warehouse_id, status, created_at)
            VALUES (:source_id, :target_id, 'Pending', NOW())
        """), {
            "source_id": order_data.source_warehouse_id,
            "target_id": order_data.target_warehouse_id
        })
        
        transfer_order_id = result.lastrowid
        
        # Add items
        for item in order_data.items:
            db.execute(text("""
                INSERT INTO transfer_order_items (transfer_order_id, ingredient_id, quantity)
                VALUES (:order_id, :ingredient_id, :quantity)
            """), {
                "order_id": transfer_order_id,
                "ingredient_id": item["ingredient_id"],
                "quantity": item["quantity"]
            })
        
        db.commit()
        
        return {
            "success": True,
            "transfer_order_id": transfer_order_id,
            "message": f"Transfer order #{transfer_order_id} created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating transfer order: {str(e)}")

@router.get("/transfer-orders/pending/{warehouse_id}")
async def get_pending_transfer_orders(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Get pending transfer orders for a warehouse"""
    orders_query = text("""
        SELECT t.id, w_source.name AS source_name, w_target.name AS target_name, 
               t.created_at, t.source_warehouse_id, t.target_warehouse_id
        FROM transfer_orders t
        JOIN warehouses w_source ON t.source_warehouse_id = w_source.id
        JOIN warehouses w_target ON t.target_warehouse_id = w_target.id
        WHERE t.target_warehouse_id = :warehouse_id AND t.status = 'Pending'
        ORDER BY t.created_at DESC
    """)
    
    orders = db.execute(orders_query, {"warehouse_id": warehouse_id}).fetchall()
    
    result = []
    for order in orders:
        # Get items for this order
        items_query = text("""
            SELECT toi.ingredient_id, i.name, i.unit, toi.quantity
            FROM transfer_order_items toi
            JOIN items i ON toi.ingredient_id = i.id
            WHERE toi.transfer_order_id = :order_id
        """)
        
        items = db.execute(items_query, {"order_id": order[0]}).fetchall()
        
        result.append({
            "id": order[0],
            "source_warehouse_name": order[1],
            "target_warehouse_name": order[2],
            "created_at": order[3],
            "source_warehouse_id": order[4],
            "target_warehouse_id": order[5],
            "items": [
                {
                    "ingredient_id": item[0],
                    "ingredient_name": item[1],
                    "unit": item[2],
                    "quantity": float(item[3])
                }
                for item in items
            ]
        })
    
    return result

@router.post("/transfer-orders/receive")
async def receive_transfer_order(
    receive_data: ReceiveTransferRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Receive and process a transfer order"""
    
    try:
        # Get transfer order details
        order_query = text("""
            SELECT source_warehouse_id, target_warehouse_id, status 
            FROM transfer_orders 
            WHERE id = :order_id
        """)
        order = db.execute(order_query, {"order_id": receive_data.transfer_order_id}).fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="Transfer order not found")
        
        if order[2] != 'Pending':
            raise HTTPException(status_code=400, detail="Transfer order is not pending")
        
        source_warehouse_id, target_warehouse_id, status = order
        
        # Check if user has permission to receive transfers at target warehouse
        target_permissions = get_user_warehouse_permissions(current_user, target_warehouse_id, db)
        if not target_permissions["can_receive_transfers"]:
            raise HTTPException(status_code=403, detail="You don't have permission to receive transfers at this warehouse")
        
        # Process each item
        has_waste = False
        for item_data in receive_data.items:
            ingredient_id = item_data["ingredient_id"]
            accepted = float(item_data["accepted"])
            returned = float(item_data["returned"])
            wasted = float(item_data["wasted"])
            
            if wasted > 0:
                has_waste = True
            
            # Get original quantity sent
            sent_query = text("""
                SELECT quantity FROM transfer_order_items 
                WHERE transfer_order_id = :order_id AND ingredient_id = :ingredient_id
            """)
            sent_result = db.execute(sent_query, {
                "order_id": receive_data.transfer_order_id,
                "ingredient_id": ingredient_id
            }).fetchone()
            
            if not sent_result:
                continue
                
            sent_qty = float(sent_result[0])
            
            # Validate totals
            if accepted + returned + wasted > sent_qty + 0.01:  # Small tolerance for floating point
                raise HTTPException(
                    status_code=400, 
                    detail=f"Total quantities exceed sent amount for ingredient {ingredient_id}"
                )
            
            # Update source warehouse stock (reduce by sent amount)
            db.execute(text("""
                UPDATE warehouse_stock 
                SET quantity = quantity - :sent_qty
                WHERE warehouse_id = :warehouse_id AND ingredient_id = :ingredient_id
            """), {
                "sent_qty": sent_qty,
                "warehouse_id": source_warehouse_id,
                "ingredient_id": ingredient_id
            })
            
            # Update target warehouse stock (add accepted amount)
            if accepted > 0:
                db.execute(text("""
                    INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                    VALUES (:warehouse_id, :ingredient_id, :quantity)
                    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                """), {
                    "warehouse_id": target_warehouse_id,
                    "ingredient_id": ingredient_id,
                    "quantity": accepted
                })
            
            # Handle returned items (add back to source warehouse)
            if returned > 0:
                db.execute(text("""
                    INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                    VALUES (:warehouse_id, :ingredient_id, :quantity)
                    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                """), {
                    "warehouse_id": source_warehouse_id,
                    "ingredient_id": ingredient_id,
                    "quantity": returned
                })
            
            # Handle wasted items
            if wasted > 0 and receive_data.waste_reason:
                # Create waste log
                db.execute(text("""
                    INSERT INTO waste_logs (warehouse_id, ingredient_id, quantity, reason, created_by, created_at)
                    VALUES (:warehouse_id, :ingredient_id, :quantity, :reason, :created_by, NOW())
                """), {
                    "warehouse_id": target_warehouse_id,
                    "ingredient_id": ingredient_id,
                    "quantity": wasted,
                    "reason": f"Transfer Order #{receive_data.transfer_order_id} waste: {receive_data.waste_reason}",
                    "created_by": current_user.username
                })
            
            # Update transfer order item record
            db.execute(text("""
                UPDATE transfer_order_items
                SET accepted_qty = :accepted, returned_qty = :returned, wasted_qty = :wasted
                WHERE transfer_order_id = :order_id AND ingredient_id = :ingredient_id
            """), {
                "accepted": accepted,
                "returned": returned,
                "wasted": wasted,
                "order_id": receive_data.transfer_order_id,
                "ingredient_id": ingredient_id
            })
        
        # Validate waste reason if there's waste
        if has_waste and not receive_data.waste_reason:
            raise HTTPException(status_code=400, detail="Waste reason is required when there is waste")
        
        # Mark transfer order as received
        db.execute(text("""
            UPDATE transfer_orders 
            SET status = 'Received', received_at = NOW()
            WHERE id = :order_id
        """), {"order_id": receive_data.transfer_order_id})
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Transfer order #{receive_data.transfer_order_id} received successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error receiving transfer order: {str(e)}")

# ==========================================
# STOCK MANAGEMENT ENDPOINTS
# ==========================================

@router.put("/stock/update")
async def update_stock(
    update_data: StockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update warehouse stock for an ingredient"""
    
    # Check if user has permission to manage stock at this warehouse
    permissions = get_user_warehouse_permissions(current_user, update_data.warehouse_id, db)
    if not permissions["can_manage_stock"]:
        raise HTTPException(status_code=403, detail="You don't have permission to manage stock at this warehouse")
    
    try:
        # Get current quantity
        current_query = text("""
            SELECT COALESCE(quantity, 0) 
            FROM warehouse_stock 
            WHERE warehouse_id = :warehouse_id AND ingredient_id = :ingredient_id
        """)
        current_result = db.execute(current_query, {
            "warehouse_id": update_data.warehouse_id,
            "ingredient_id": update_data.ingredient_id
        }).fetchone()
        
        current_qty = float(current_result[0]) if current_result else 0
        change = update_data.new_quantity - current_qty
        
        # Update stock
        db.execute(text("""
            INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
            VALUES (:warehouse_id, :ingredient_id, :quantity)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        """), {
            "warehouse_id": update_data.warehouse_id,
            "ingredient_id": update_data.ingredient_id,
            "quantity": update_data.new_quantity
        })
        
        # Log stock movement if there's a change
        if abs(change) > 0.001:  # Avoid logging tiny changes due to floating point precision
            # Create stock_movements table if it doesn't exist
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    ingredient_id INT NOT NULL,
                    warehouse_id INT NOT NULL,
                    change_qty DECIMAL(10, 3) NOT NULL,
                    reason VARCHAR(100) NOT NULL,
                    timestamp DATETIME NOT NULL,
                    created_by VARCHAR(100),
                    FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE,
                    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """))
            
            db.execute(text("""
                INSERT INTO stock_movements (ingredient_id, warehouse_id, change_qty, reason, timestamp, created_by)
                VALUES (:ingredient_id, :warehouse_id, :change_qty, :reason, NOW(), :created_by)
            """), {
                "ingredient_id": update_data.ingredient_id,
                "warehouse_id": update_data.warehouse_id,
                "change_qty": change,
                "reason": update_data.reason,
                "created_by": current_user.username
            })
        
        # Update category if provided
        if update_data.category_id is not None:
            db.execute(text("""
                UPDATE items SET category_id = :category_id WHERE id = :ingredient_id
            """), {
                "category_id": update_data.category_id,
                "ingredient_id": update_data.ingredient_id
            })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Stock updated successfully",
            "change": change,
            "new_quantity": update_data.new_quantity
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating stock: {str(e)}")

@router.post("/stock/upload-template/{warehouse_id}")
async def upload_stock_template(
    warehouse_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Upload Excel template to update stock quantities"""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")
    
    try:
        # Read Excel file
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        
        # Validate required columns
        required_cols = {"ingredient_id", "quantity", "ingredient_name"}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            raise HTTPException(
                status_code=400,
                detail=f"Excel must include columns: {', '.join(missing)}"
            )
        
        updates_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                ingredient_id = int(row["ingredient_id"])
                new_qty = float(row["quantity"])
                ingredient_name = str(row.get("ingredient_name", "")).strip()
                
                if not ingredient_name:
                    errors.append(f"Row {index + 1}: Missing ingredient name")
                    continue
                
                # Get current quantity
                current_query = text("""
                    SELECT COALESCE(quantity, 0) 
                    FROM warehouse_stock 
                    WHERE warehouse_id = :warehouse_id AND ingredient_id = :ingredient_id
                """)
                current_result = db.execute(current_query, {
                    "warehouse_id": warehouse_id,
                    "ingredient_id": ingredient_id
                }).fetchone()
                
                current_qty = float(current_result[0]) if current_result else 0
                change = new_qty - current_qty
                
                # Update stock
                db.execute(text("""
                    INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                    VALUES (:warehouse_id, :ingredient_id, :quantity)
                    ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
                """), {
                    "warehouse_id": warehouse_id,
                    "ingredient_id": ingredient_id,
                    "quantity": new_qty
                })
                
                # Log movement if significant change
                if abs(change) > 0.001:
                    db.execute(text("""
                        INSERT INTO stock_movements (ingredient_id, warehouse_id, change_qty, reason, timestamp, created_by)
                        VALUES (:ingredient_id, :warehouse_id, :change_qty, :reason, NOW(), :created_by)
                    """), {
                        "ingredient_id": ingredient_id,
                        "warehouse_id": warehouse_id,
                        "change_qty": change,
                        "reason": "Excel Upload",
                        "created_by": current_user.username
                    })
                
                updates_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        db.commit()
        
        result = {
            "success": True,
            "updates_count": updates_count,
            "message": f"Updated {updates_count} items successfully"
        }
        
        if errors:
            result["errors"] = errors
            result["message"] += f", {len(errors)} errors occurred"
        
        return result
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")

@router.get("/stock/template/{warehouse_id}")
async def download_stock_template(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Download Excel template for stock updates"""
    
    try:
        # Get current stock data
        stock_query = text("""
            SELECT i.id AS ingredient_id, i.name AS ingredient_name, 
                   COALESCE(ws.quantity, 0) AS quantity
            FROM items i
            LEFT JOIN warehouse_stock ws ON i.id = ws.ingredient_id AND ws.warehouse_id = :warehouse_id
            ORDER BY i.name
        """)
        
        stock_data = db.execute(stock_query, {"warehouse_id": warehouse_id}).fetchall()
        
        # Create DataFrame
        df = pd.DataFrame([
            {
                "ingredient_id": s[0],
                "ingredient_name": s[1],
                "quantity": float(s[2])
            }
            for s in stock_data
        ])
        
        # Convert to Excel
        excel_buffer = BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        # Get warehouse name
        warehouse_name = db.execute(text("SELECT name FROM warehouses WHERE id = :id"), 
                                  {"id": warehouse_id}).fetchone()[0]
        
        filename = f"{warehouse_name}_stock_template.xlsx"
        
        return {
            "success": True,
            "filename": filename,
            "data": excel_buffer.getvalue().hex()  # Send as hex string
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")

# ==========================================
# CATEGORY MANAGEMENT ENDPOINTS
# ==========================================

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all inventory categories"""
    
    # Create table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS inventory_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    categories = db.execute(text("SELECT id, name FROM inventory_categories ORDER BY name")).fetchall()
    return [{"id": c[0], "name": c[1]} for c in categories]

@router.post("/categories")
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new inventory category"""
    
    try:
        result = db.execute(text("""
            INSERT INTO inventory_categories (name) VALUES (:name)
        """), {"name": category_data.name.strip()})
        
        db.commit()
        
        return {
            "success": True,
            "id": result.lastrowid,
            "name": category_data.name.strip(),
            "message": f"Category '{category_data.name.strip()}' created successfully"
        }
        
    except Exception as e:
        db.rollback()
        if "Duplicate entry" in str(e) or "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=400, detail="Category already exists")
        else:
            raise HTTPException(status_code=500, detail=f"Error creating category: {str(e)}")

@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update an inventory category"""
    
    try:
        result = db.execute(text("""
            UPDATE inventory_categories SET name = :name WHERE id = :id
        """), {"name": category_data.name.strip(), "id": category_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Category updated to '{category_data.name.strip()}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        if "Duplicate entry" in str(e) or "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=400, detail="A category with this name already exists")
        else:
            raise HTTPException(status_code=500, detail=f"Error updating category: {str(e)}")

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Delete an inventory category"""
    
    try:
        # Check if category is in use
        usage_check = db.execute(text("""
            SELECT COUNT(*) FROM items WHERE category_id = :category_id
        """), {"category_id": category_id}).fetchone()
        
        if usage_check[0] > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete category as it's used in {usage_check[0]} items"
            )
        
        result = db.execute(text("""
            DELETE FROM inventory_categories WHERE id = :id
        """), {"id": category_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Category deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting category: {str(e)}")

# ==========================================
# INGREDIENTS/ITEMS ENDPOINTS
# ==========================================

@router.get("/ingredients")
async def get_ingredients(db: Session = Depends(get_db)):
    """Get all ingredients/items"""
    ingredients = db.execute(text("""
        SELECT i.id, i.name, i.unit, ic.name as category_name
        FROM items i
        LEFT JOIN inventory_categories ic ON i.category_id = ic.id
        ORDER BY i.name
    """)).fetchall()
    
    return [
        {
            "id": i[0],
            "name": i[1],
            "unit": i[2],
            "category_name": i[3] or "Uncategorized"
        }
        for i in ingredients
    ]

# ==========================================
# WAREHOUSE MANAGER ASSIGNMENT ENDPOINTS
# ==========================================

@router.get("/warehouse-assignments")
async def get_warehouse_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all warehouse manager assignments (Admin only)"""
    
    # Check if user is admin
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can view warehouse assignments")
    
    assignments = db.query(models.WarehouseManagerAssignment).all()
    result = []
    
    for assignment in assignments:
        user = db.query(models.User).filter(models.User.id == assignment.user_id).first()
        warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
        assigner = db.query(models.User).filter(models.User.id == assignment.assigned_by).first() if assignment.assigned_by else None
        
        result.append(schemas.WarehouseManagerAssignmentWithDetails(
            id=assignment.id,
            user_id=assignment.user_id,
            warehouse_id=assignment.warehouse_id,
            can_view_stock=assignment.can_view_stock,
            can_create_transfers_out=assignment.can_create_transfers_out,
            can_receive_transfers=assignment.can_receive_transfers,
            can_manage_stock=assignment.can_manage_stock,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at,
            user_username=user.username if user else "Unknown",
            warehouse_name=warehouse.name if warehouse else "Unknown",
            assigner_username=assigner.username if assigner else None
        ))
    
    return result

@router.post("/warehouse-assignments")
async def create_warehouse_assignment(
    assignment: schemas.WarehouseManagerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Assign a user to manage a warehouse (Admin only)"""
    
    # Check if user is admin
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can assign warehouse managers")
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == assignment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if warehouse exists
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Check if assignment already exists
    existing = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.user_id == assignment.user_id,
        models.WarehouseManagerAssignment.warehouse_id == assignment.warehouse_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already assigned to this warehouse")
    
    # Create assignment
    db_assignment = models.WarehouseManagerAssignment(
        user_id=assignment.user_id,
        warehouse_id=assignment.warehouse_id,
        can_view_stock=assignment.can_view_stock,
        can_create_transfers_out=assignment.can_create_transfers_out,
        can_receive_transfers=assignment.can_receive_transfers,
        can_manage_stock=assignment.can_manage_stock,
        assigned_by=current_user.id
    )
    
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return {
        "success": True,
        "message": f"User {user.username} assigned to warehouse {warehouse.name}",
        "assignment": schemas.WarehouseManagerAssignment.model_validate(db_assignment)
    }

@router.put("/warehouse-assignments/{assignment_id}")
async def update_warehouse_assignment(
    assignment_id: int,
    update_data: schemas.WarehouseManagerAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update warehouse manager assignment permissions (Admin only)"""
    
    # Check if user is admin
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can update warehouse assignments")
    
    # Get assignment
    assignment = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Update permissions
    if update_data.can_view_stock is not None:
        assignment.can_view_stock = update_data.can_view_stock
    if update_data.can_create_transfers_out is not None:
        assignment.can_create_transfers_out = update_data.can_create_transfers_out
    if update_data.can_receive_transfers is not None:
        assignment.can_receive_transfers = update_data.can_receive_transfers
    if update_data.can_manage_stock is not None:
        assignment.can_manage_stock = update_data.can_manage_stock
    
    db.commit()
    db.refresh(assignment)
    
    return {
        "success": True,
        "message": "Assignment updated successfully",
        "assignment": schemas.WarehouseManagerAssignment.model_validate(assignment)
    }

@router.delete("/warehouse-assignments/{assignment_id}")
async def delete_warehouse_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Remove warehouse manager assignment (Admin only)"""
    
    # Check if user is admin
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can remove warehouse assignments")
    
    # Get assignment
    assignment = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get user and warehouse names for response
    user = db.query(models.User).filter(models.User.id == assignment.user_id).first()
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
    
    db.delete(assignment)
    db.commit()
    
    return {
        "success": True,
        "message": f"Removed {user.username if user else 'User'} from {warehouse.name if warehouse else 'warehouse'}"
    }

@router.get("/user/{user_id}/warehouse-assignments")
async def get_user_warehouse_assignments(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get warehouse assignments for a specific user"""
    
    # Users can only view their own assignments unless they're admin
    if current_user.id != user_id and current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Can only view your own warehouse assignments")
    
    assignments = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.user_id == user_id
    ).all()
    
    result = []
    for assignment in assignments:
        warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
        result.append({
            "id": assignment.id,
            "warehouse_id": assignment.warehouse_id,
            "warehouse_name": warehouse.name if warehouse else "Unknown",
            "can_view_stock": assignment.can_view_stock,
            "can_create_transfers_out": assignment.can_create_transfers_out,
            "can_receive_transfers": assignment.can_receive_transfers,
            "can_manage_stock": assignment.can_manage_stock,
            "assigned_at": assignment.assigned_at
        })
    
    return result

@router.get("/user/my-warehouses")
async def get_my_warehouses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get warehouses that the current user can manage"""
    
    # Admin can see all warehouses
    if current_user.role.name == "Admin":
        warehouses = db.query(models.Warehouse).all()
        return [
            {
                "id": w.id,
                "name": w.name,
                "location": w.location,
                "can_view_stock": True,
                "can_create_transfers_out": True,
                "can_receive_transfers": True,
                "can_manage_stock": True
            }
            for w in warehouses
        ]
    
    # Get user's assigned warehouses
    assignments = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.user_id == current_user.id
    ).all()
    
    result = []
    for assignment in assignments:
        warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == assignment.warehouse_id).first()
        if warehouse:
            result.append({
                "id": warehouse.id,
                "name": warehouse.name,
                "location": warehouse.location,
                "can_view_stock": assignment.can_view_stock,
                "can_create_transfers_out": assignment.can_create_transfers_out,
                "can_receive_transfers": assignment.can_receive_transfers,
                "can_manage_stock": assignment.can_manage_stock
            })
    
    return result

def get_user_warehouse_permissions(user: models.User, warehouse_id: int, db: Session) -> dict:
    """Helper function to get user's permissions for a specific warehouse"""
    
    # Admin has all permissions
    if user.role.name == "Admin":
        return {
            "can_view_stock": True,
            "can_create_transfers_out": True,
            "can_receive_transfers": True,
            "can_manage_stock": True
        }
    
    # Check if user has assignment for this warehouse
    assignment = db.query(models.WarehouseManagerAssignment).filter(
        models.WarehouseManagerAssignment.user_id == user.id,
        models.WarehouseManagerAssignment.warehouse_id == warehouse_id
    ).first()
    
    if not assignment:
        return {
            "can_view_stock": False,
            "can_create_transfers_out": False,
            "can_receive_transfers": False,
            "can_manage_stock": False
        }
    
    return {
        "can_view_stock": assignment.can_view_stock,
        "can_create_transfers_out": assignment.can_create_transfers_out,
        "can_receive_transfers": assignment.can_receive_transfers,
        "can_manage_stock": assignment.can_manage_stock
    }

# ------------------------------------------------------------------
# 🆕 CREATE WAREHOUSE ENDPOINT
# ------------------------------------------------------------------

@router.post("/warehouses", response_model=dict, status_code=201)
async def create_warehouse(
    warehouse: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new warehouse (Admin-only).

    This writes directly to the `warehouses` table and returns a success
    flag together with the newly created warehouse object. The route
    intentionally mirrors the existing **GET /warehouses** endpoint so
    the frontend can POST to exactly the same URL it already uses.
    """

    # ✅ 1. Authorisation: only admins can create new warehouses.
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can create warehouses")

    # ✅ 2. Validation: unique (case-insensitive) warehouse name.
    existing = db.execute(
        text("SELECT COUNT(*) FROM warehouses WHERE LOWER(name) = LOWER(:name)"),
        {"name": warehouse.name.strip()}
    ).fetchone()[0]

    if existing:
        raise HTTPException(status_code=400, detail="Warehouse name already exists")

    # ✅ 3. Insert and commit.
    insert_result = db.execute(
        text("""
            INSERT INTO warehouses (name, location, created_at)
            VALUES (:name, :location, NOW())
        """),
        {
            "name": warehouse.name.strip(),
            "location": (warehouse.location or "").strip() or None,
        }
    )

    new_id = insert_result.lastrowid
    db.commit()

    # ✅ 4. Return unified response format for the frontend.
    return {
        "success": True,
        "message": f"Warehouse '{warehouse.name}' created successfully",
        "data": {
            "id": new_id,
            "name": warehouse.name,
            "location": warehouse.location,
        },
    } 