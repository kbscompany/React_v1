from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import schemas
import models
from database import get_db
from auth import get_current_active_user

router = APIRouter(prefix="/safes", tags=["Safes"])

@router.get("/", response_model=List[schemas.Safe])
async def get_safes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all safes"""
    try:
        safes = db.query(models.Safe).filter(models.Safe.is_active == True).all()
        return safes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching safes: {str(e)}")

@router.post("/", response_model=schemas.Safe)
async def create_safe(
    safe: schemas.SafeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new safe"""
    try:
        db_safe = models.Safe(**safe.dict(), current_balance=safe.initial_balance)
        db.add(db_safe)
        db.commit()
        db.refresh(db_safe)
        return db_safe
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating safe: {str(e)}")

@router.put("/{safe_id}/balance", response_model=schemas.Safe)
async def update_safe_balance(
    safe_id: int,
    balance_update: schemas.SafeBalanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update safe balance"""
    try:
        db_safe = db.query(models.Safe).filter(models.Safe.id == safe_id).first()
        if not db_safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        db_safe.current_balance = balance_update.amount
        db.commit()
        db.refresh(db_safe)
        return db_safe
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating safe balance: {str(e)}")

# Simple endpoint for frontend compatibility  
@router.get("/simple", summary="Simple safes endpoint")
async def get_safes_simple(db: Session = Depends(get_db)):
    """Get safes in simple format"""
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
            "safes": safes
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "safes": []
        }

@router.get("/{safe_id}/cheques")
async def get_safe_cheques(
    safe_id: int,
    limit: int = 10,
    offset: int = 0,
    cheque_number: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get cheques assigned to a specific safe with filtering and pagination"""
    try:
        import os
        import glob
        
        # Verify safe exists
        safe = db.execute(text("SELECT id, name FROM safes WHERE id = :id"), 
                         {"id": safe_id}).fetchone()
        if not safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        # Build dynamic WHERE conditions
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
                   c.settled_by_cheque_id
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
                    EARLY_SETTLEMENT_UPLOAD_DIR = "uploads/early_settlement_files"
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
            
            cheques.append({
                "id": row[0],
                "cheque_number": row[1],
                "amount": cheque_amount,
                "status": row[3] or "assigned",
                "issue_date": row[4].isoformat() if row[4] else None,
                "due_date": row[5].isoformat() if row[5] else None,  # Added due_date field
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
                "expense_count": 0,
                "attachments": attachments,
                "has_attachments": len(attachments) > 0
            })
        
        return cheques
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{safe_id}/overspent-cheques")
async def get_overspent_cheques(
    safe_id: int,
    db: Session = Depends(get_db)
):
    """Get all overspent cheques for a safe"""
    try:
        # Verify safe exists
        safe = db.execute(text("SELECT id, name FROM safes WHERE id = :id"), 
                         {"id": safe_id}).fetchone()
        if not safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        # Get overspent cheques
        result = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.status, 
                   c.issue_date, c.description,
                   ba.account_name, ba.bank_name,
                   c.total_expenses, c.overspent_amount,
                   c.is_settled, c.settlement_date
            FROM cheques c
            LEFT JOIN bank_accounts ba ON c.bank_account_id = ba.id
            WHERE c.safe_id = :safe_id
            AND c.is_assigned_to_safe = 1
            AND c.status = 'overspent'
            AND c.is_settled = 0
            ORDER BY c.cheque_number
        """), {"safe_id": safe_id})
        
        cheques = []
        for row in result:
            cheque_amount = float(row[2]) if row[2] else 0.0
            total_expenses = float(row[8]) if row[8] else 0.0
            overspent_amount = float(row[9]) if row[9] else 0.0
            
            cheques.append({
                "id": row[0],
                "cheque_number": row[1],
                "amount": cheque_amount,
                "status": row[3] or "overspent",
                "issue_date": row[4].isoformat() if row[4] else None,
                "description": row[5] or "",
                "bank_account": f"{row[6]} ({row[7]})" if row[6] else "Unknown",
                "total_expenses": total_expenses,
                "overspent_amount": overspent_amount,
                "remaining_amount": cheque_amount - total_expenses
            })
        
        return cheques
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 