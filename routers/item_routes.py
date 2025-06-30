from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import schemas
import models
from database import get_db

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
        
        # Get items
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
            items.append({
                "id": row[0],
                "name": row[1] or "Unknown Item",
                "description": row[2] or "",
                "unit": row[3] or "units",
                "price_per_unit": float(row[4]) if row[4] else 0.0,
                "category_name": row[5] or "Uncategorized",
                "category_id": row[6],
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
            "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}
        }

@router.get("/items-statistics")
async def get_items_statistics(db: Session = Depends(get_db)):
    """Get item statistics"""
    try:
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_items,
                COUNT(DISTINCT category_id) as total_categories,
                COALESCE(AVG(price_per_unit), 0) as avg_price,
                COALESCE(SUM(price_per_unit), 0) as total_price_sum
            FROM items
        """))
        
        row = result.fetchone()
        
        return {
            "success": True,
            "statistics": {
                "total_items": row[0] if row else 0,
                "total_categories": row[1] if row else 0,
                "average_price": float(row[2]) if row and row[2] else 0.0,
                "total_inventory_value": float(row[3]) if row and row[3] else 0.0  # Sum of all prices
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "statistics": {
                "total_items": 0,
                "total_categories": 0,
                "average_price": 0.0,
                "total_inventory_value": 0.0
            }
        } 