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

# ==========================================
# WAREHOUSE ENDPOINTS
# ==========================================

@router.get("/warehouses")
async def get_warehouses(db: Session = Depends(get_db)):
    """Get all warehouses"""
    # Create warehouses table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS warehouses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            location VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Create warehouse_stock table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS warehouse_stock (
            id INT AUTO_INCREMENT PRIMARY KEY,
            warehouse_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            quantity DECIMAL(10, 3) DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_warehouse_ingredient (warehouse_id, ingredient_id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Create transfer_orders table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transfer_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            source_warehouse_id INT NOT NULL,
            target_warehouse_id INT NOT NULL,
            status VARCHAR(20) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            received_at TIMESTAMP NULL,
            FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (target_warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Create transfer_order_items table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS transfer_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transfer_order_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            quantity DECIMAL(10, 3) NOT NULL,
            accepted_qty DECIMAL(10, 3) DEFAULT NULL,
            returned_qty DECIMAL(10, 3) DEFAULT NULL,
            wasted_qty DECIMAL(10, 3) DEFAULT NULL,
            FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Create waste_logs table if it doesn't exist
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS waste_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            warehouse_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            quantity DECIMAL(10, 3) NOT NULL,
            reason TEXT,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) DEFAULT 'Pending',
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    
    # Insert default warehouses if none exist
    existing = db.execute(text("SELECT COUNT(*) FROM warehouses")).fetchone()[0]
    if existing == 0:
        default_warehouses = [
            "Main Storage",
            "Kitchen Storage", 
            "Cold Storage",
            "Dry Storage"
        ]
        
        for warehouse_name in default_warehouses:
            db.execute(text("""
                INSERT INTO warehouses (name) VALUES (:name)
            """), {"name": warehouse_name})
    
    db.commit()
    
    warehouses = db.execute(text("SELECT id, name FROM warehouses ORDER BY name")).fetchall()
    return [{"id": w[0], "name": w[1]} for w in warehouses]

@router.get("/warehouses/{warehouse_id}/stock")
async def get_warehouse_stock(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Get stock for a specific warehouse"""
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

@router.get("/ingredients/low-stock/{source_warehouse_id}/{dest_warehouse_id}")
async def get_low_stock_items(
    source_warehouse_id: int,
    dest_warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Get items with low stock that need replenishment"""
    
    low_stock_query = text("""
        SELECT i.id, i.name, i.unit, 
               COALESCE(ws_dest.quantity, 0) as dest_qty,
               COALESCE(ws_source.quantity, 0) as source_qty,
               COALESCE(i.minimum_stock, 0) as min_stock
        FROM items i
        LEFT JOIN warehouse_stock ws_dest ON i.id = ws_dest.ingredient_id AND ws_dest.warehouse_id = :dest_id
        LEFT JOIN warehouse_stock ws_source ON i.id = ws_source.ingredient_id AND ws_source.warehouse_id = :source_id
        WHERE COALESCE(ws_dest.quantity, 0) < COALESCE(i.minimum_stock, 10)
          AND COALESCE(ws_source.quantity, 0) > 0
        ORDER BY (COALESCE(i.minimum_stock, 10) - COALESCE(ws_dest.quantity, 0)) DESC
    """)
    
    items = db.execute(low_stock_query, {
        "dest_id": dest_warehouse_id,
        "source_id": source_warehouse_id
    }).fetchall()
    
    return [
        {
            "ingredient_id": item[0],
            "ingredient_name": item[1],
            "unit": item[2],
            "dest_quantity": float(item[3]),
            "source_quantity": float(item[4]),
            "minimum_stock": float(item[5]) if item[5] > 0 else 10.0,
            "suggested_quantity": min(max(float(item[5]) if item[5] > 0 else 10.0, 10.0) - float(item[3]), float(item[4]))
        }
        for item in items
    ]

# ==========================================
# SHOP MANAGEMENT ENDPOINTS
# ==========================================

@router.patch("/warehouses/{warehouse_id}/shop-settings")
async def update_warehouse_shop_settings(
    warehouse_id: int,
    shop_data: schemas.WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update warehouse shop settings (convert to/from shop)"""
    
    # Get warehouse
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Update fields
    if shop_data.name is not None:
        warehouse.name = shop_data.name
    if shop_data.location is not None:
        warehouse.location = shop_data.location
    if shop_data.is_shop is not None:
        warehouse.is_shop = shop_data.is_shop
    if shop_data.foodics_branch_id is not None:
        warehouse.foodics_branch_id = shop_data.foodics_branch_id
    if shop_data.auto_sync is not None:
        warehouse.auto_sync = shop_data.auto_sync
    
    db.commit()
    db.refresh(warehouse)
    
    return {
        "success": True,
        "message": f"Warehouse {'converted to shop' if warehouse.is_shop else 'converted to warehouse'}",
        "warehouse": {
            "id": warehouse.id,
            "name": warehouse.name,
            "location": warehouse.location,
            "is_shop": warehouse.is_shop,
            "foodics_branch_id": warehouse.foodics_branch_id,
            "auto_sync": warehouse.auto_sync
        }
    }

@router.get("/shops")
async def get_shops(db: Session = Depends(get_db)):
    """Get all warehouses that are configured as shops"""
    
    shops = db.query(models.Warehouse).filter(models.Warehouse.is_shop == True).all()
    
    return [
        {
            "id": shop.id,
            "name": shop.name,
            "location": shop.location,
            "foodics_branch_id": shop.foodics_branch_id,
            "auto_sync": shop.auto_sync,
            "created_at": shop.created_at
        }
        for shop in shops
    ]

@router.post("/shops/{shop_id}/sync-foodics")
async def sync_shop_with_foodics(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Manually trigger Foodics sync for a specific shop"""
    
    # Get shop
    shop = db.query(models.Warehouse).filter(
        models.Warehouse.id == shop_id,
        models.Warehouse.is_shop == True
    ).first()
    
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if not shop.foodics_branch_id:
        raise HTTPException(status_code=400, detail="Shop not linked to Foodics branch")
    
    # TODO: Implement actual Foodics sync logic here
    # For now, return a placeholder response
    
    return {
        "success": True,
        "message": f"Foodics sync initiated for shop '{shop.name}'",
        "shop_id": shop_id,
        "foodics_branch_id": shop.foodics_branch_id,
        "sync_status": "pending"
    } 