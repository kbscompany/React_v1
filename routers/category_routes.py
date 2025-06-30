from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import schemas
import models
from database import get_db
from auth import get_current_active_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/simple", summary="Simple categories endpoint")
async def get_categories_simple(db: Session = Depends(get_db)):
    """Get categories in simple format"""
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
            "categories": categories
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "categories": []
        }

@router.get("/tree-simple", summary="Simple category tree")
async def get_expense_categories_tree_simple(db: Session = Depends(get_db)):
    """Get expense categories in tree format"""
    try:
        result = db.execute(text("""
            SELECT id, name, description, parent_id, is_active, level
            FROM expense_categories 
            WHERE is_active = 1
            ORDER BY level ASC, name ASC
        """))
        
        categories = []
        for row in result:
            categories.append({
                "id": row[0],
                "name": row[1] or "Unknown Category",
                "description": row[2] or "",
                "parent_id": row[3],
                "is_active": bool(row[4]),
                "level": row[5] or 0,
                "children": []
            })
        
        # Build tree structure
        category_dict = {cat["id"]: cat for cat in categories}
        root_categories = []
        
        for cat in categories:
            if cat["parent_id"] and cat["parent_id"] in category_dict:
                category_dict[cat["parent_id"]]["children"].append(cat)
            else:
                root_categories.append(cat)
        
        return {
            "success": True,
            "count": len(root_categories),
            "categories": root_categories
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "categories": []
        } 