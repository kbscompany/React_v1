from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import schemas
import models
from database import get_db
from auth import get_current_active_user

router = APIRouter(tags=["Items"])

@router.get("/items-manage")
async def get_items_manage(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    category: str = "",
    db: Session = Depends(get_db)
):
    """Get items for management with pagination"""
    try:
        offset = (page - 1) * per_page
        
        # Build query conditions
        where_conditions = ["1=1"]
        params = {"limit": per_page, "offset": offset}
        
        if search:
            where_conditions.append("(i.name LIKE :search OR i.description LIKE :search)")
            params["search"] = f"%{search}%"
        
        if category:
            where_conditions.append("c.name = :category")
            params["category"] = category
        
        where_clause = " AND ".join(where_conditions)
        
        # Get items with their packages
        result = db.execute(text(f"""
            SELECT i.id, i.name, i.description, i.unit, i.price_per_unit,
                   c.name as category_name, i.category_id
            FROM items i
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            WHERE {where_clause}
            ORDER BY i.name ASC
            LIMIT :limit OFFSET :offset
        """), params)
        
        items = []
        for row in result:
            item_id = row[0]
            
            # Get packages for this item
            packages_result = db.execute(text("""
                SELECT id, package_name, quantity_per_package, weight_per_item, 
                       price_per_package, is_default, is_price_manual, unit
                FROM ingredient_packages 
                WHERE ingredient_id = :item_id
                ORDER BY is_default DESC, package_name ASC
            """), {"item_id": item_id})
            
            packages = []
            for pkg_row in packages_result:
                packages.append({
                    "id": pkg_row[0],
                    "package_name": pkg_row[1] or "",
                    "quantity_per_package": float(pkg_row[2]) if pkg_row[2] else 0.0,
                    "weight_per_item": float(pkg_row[3]) if pkg_row[3] else 0.0,
                    "price_per_package": float(pkg_row[4]) if pkg_row[4] else 0.0,
                    "is_default": bool(pkg_row[5]),
                    "is_price_manual": bool(pkg_row[6]),
                    "unit": pkg_row[7] or "units"
                })
            
            items.append({
                "id": item_id,
                "name": row[1] or "Unknown Item",
                "description": row[2] or "",
                "unit": row[3] or "units",
                "price_per_unit": float(row[4]) if row[4] else 0.0,
                "category_name": row[5] or "Uncategorized",
                "category_id": row[6],
                "packages": packages,
                "stock_quantity": 0.0  # Default value since column doesn't exist
            })
        
        # Get total count
        count_result = db.execute(text(f"""
            SELECT COUNT(*) 
            FROM items i
            LEFT JOIN inventory_categories c ON i.category_id = c.id
            WHERE {where_clause}
        """), {k: v for k, v in params.items() if k not in ['limit', 'offset']})
        
        total = count_result.fetchone()[0]
        
        return {
            "success": True,
            "items": items,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "items": [],
            "total": 0,
            "total_pages": 0,
            "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}
        }

@router.put("/items-manage/{item_id}")
async def update_item_manage(
    item_id: int,
    item_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an item"""
    try:
        # Check if item exists
        item_check = db.execute(text("""
            SELECT id FROM items WHERE id = :item_id
        """), {"item_id": item_id})
        
        if not item_check.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Extract data
        name = item_data.get("name", "").strip()
        unit = item_data.get("unit", "units").strip()
        price_per_unit = float(item_data.get("price_per_unit", 0.0))
        category_id = item_data.get("category_id")
        
        if not name:
            raise HTTPException(status_code=400, detail="Item name is required")
        
        # Handle category_id
        if category_id == "" or category_id is None:
            category_id = None
        else:
            category_id = int(category_id)
        
        # Update item
        db.execute(text("""
            UPDATE items 
            SET name = :name, unit = :unit, price_per_unit = :price_per_unit, category_id = :category_id
            WHERE id = :item_id
        """), {
            "name": name,
            "unit": unit,
            "price_per_unit": price_per_unit,
            "category_id": category_id,
            "item_id": item_id
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Item updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/items-manage/{item_id}")
async def delete_item_manage(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete an item"""
    try:
        # Check if item exists
        item_check = db.execute(text("""
            SELECT id FROM items WHERE id = :item_id
        """), {"item_id": item_id})
        
        if not item_check.fetchone():
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Check if item is used in any recipes or other tables
        usage_check = db.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM sub_recipe_ingredients WHERE ingredient_id = :item_id) +
                (SELECT COUNT(*) FROM mid_prep_ingredients WHERE ingredient_id = :item_id) +
                (SELECT COUNT(*) FROM cake_ingredients WHERE ingredient_id = :item_id) as usage_count
        """), {"item_id": item_id})
        
        usage_count = usage_check.fetchone()[0]
        if usage_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete item: it is used in {usage_count} recipe(s). Remove from recipes first."
            )
        
        # Delete associated packages first
        db.execute(text("""
            DELETE FROM ingredient_packages WHERE ingredient_id = :item_id
        """), {"item_id": item_id})
        
        # Delete the item
        db.execute(text("""
            DELETE FROM items WHERE id = :item_id
        """), {"item_id": item_id})
        
        db.commit()
        
        return {
            "success": True,
            "message": "Item deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/items-manage/{item_id}/packages")
async def add_item_package(
    item_id: int,
    package_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add a package to an item"""
    try:
        # Check if item exists
        item_check = db.execute(text("""
            SELECT id, unit FROM items WHERE id = :item_id
        """), {"item_id": item_id})
        
        item_row = item_check.fetchone()
        if not item_row:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item_unit = item_row[1] or "units"
        
        # Extract package data
        package_name = package_data.get("package_name", "").strip()
        quantity_per_package = float(package_data.get("quantity_per_package", 0.0))
        weight_per_item = float(package_data.get("weight_per_item", 0.0))
        is_default = bool(package_data.get("is_default", False))
        
        if not package_name:
            raise HTTPException(status_code=400, detail="Package name is required")
        
        if quantity_per_package <= 0:
            raise HTTPException(status_code=400, detail="Quantity per package must be greater than 0")
        
        # If this is set as default, remove default from other packages
        if is_default:
            db.execute(text("""
                UPDATE ingredient_packages 
                SET is_default = FALSE 
                WHERE ingredient_id = :item_id
            """), {"item_id": item_id})
        
        # Calculate price per package (basic calculation)
        item_price = db.execute(text("""
            SELECT price_per_unit FROM items WHERE id = :item_id
        """), {"item_id": item_id}).fetchone()[0] or 0.0
        
        price_per_package = float(item_price) * quantity_per_package
        
        # Insert new package
        db.execute(text("""
            INSERT INTO ingredient_packages (
                ingredient_id, package_name, quantity_per_package, 
                weight_per_item, price_per_package, is_default, 
                is_price_manual, unit
            ) VALUES (
                :item_id, :package_name, :quantity_per_package,
                :weight_per_item, :price_per_package, :is_default,
                FALSE, :unit
            )
        """), {
            "item_id": item_id,
            "package_name": package_name,
            "quantity_per_package": quantity_per_package,
            "weight_per_item": weight_per_item,
            "price_per_package": price_per_package,
            "is_default": is_default,
            "unit": item_unit
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Package added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/items-manage/packages/{package_id}")
async def delete_item_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a package"""
    try:
        # Check if package exists
        package_check = db.execute(text("""
            SELECT id FROM ingredient_packages WHERE id = :package_id
        """), {"package_id": package_id})
        
        if not package_check.fetchone():
            raise HTTPException(status_code=404, detail="Package not found")
        
        # Delete the package
        db.execute(text("""
            DELETE FROM ingredient_packages WHERE id = :package_id
        """), {"package_id": package_id})
        
        db.commit()
        
        return {
            "success": True,
            "message": "Package deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/items-statistics")
async def get_items_statistics(db: Session = Depends(get_db)):
    """Get item statistics"""
    try:
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_items,
                COUNT(DISTINCT category_id) as categories_used,
                COALESCE(AVG(price_per_unit), 0) as average_price,
                COALESCE(SUM(price_per_unit), 0) as total_price_sum
            FROM items
        """))
        
        row = result.fetchone()
        
        return {
            "total_items": row[0] if row else 0,
            "categories_used": row[1] if row else 0,
            "average_price": float(row[2]) if row and row[2] else 0.0,
            "total_inventory_value": float(row[3]) if row and row[3] else 0.0
        }
    except Exception as e:
        return {
            "total_items": 0,
            "categories_used": 0,
            "average_price": 0.0,
            "total_inventory_value": 0.0
        } 