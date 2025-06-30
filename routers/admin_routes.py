from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_active_user, User

router = APIRouter()

@router.post("/admin-simple/reset-safe/{safe_id}")
async def reset_safe_simple(safe_id: int, db: Session = Depends(get_db)):
    """Reset a specific safe - removes all cheques and expenses from it"""
    try:
        # Check if safe exists
        safe = db.execute(text("SELECT id, name, initial_balance FROM safes WHERE id = :id AND is_active = 1"), 
                         {"id": safe_id}).fetchone()
        if not safe:
            raise HTTPException(status_code=404, detail="Safe not found")
        
        safe_name = safe[1]
        initial_balance = safe[2] or 0.0
        
        # Remove all cheques from this safe
        db.execute(text("""
            UPDATE cheques 
            SET is_assigned_to_safe = 0, safe_id = NULL 
            WHERE safe_id = :safe_id
        """), {"safe_id": safe_id})
        
        # Delete all expenses from this safe
        db.execute(text("DELETE FROM expenses WHERE safe_id = :safe_id"), {"safe_id": safe_id})
        
        # Reset safe balance to initial balance
        db.execute(text("""
            UPDATE safes 
            SET current_balance = :initial_balance 
            WHERE id = :safe_id
        """), {"safe_id": safe_id, "initial_balance": initial_balance})
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Safe '{safe_name}' has been reset successfully",
            "safe_id": safe_id,
            "safe_name": safe_name,
            "reset_balance": initial_balance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting safe: {str(e)}")

@router.post("/admin-simple/reset-all-safes")
async def reset_all_safes_simple(confirm: str = None, db: Session = Depends(get_db)):
    """Reset ALL safes - removes all cheques and expenses from all safes"""
    try:
        if confirm != "true":
            return {
                "success": False,
                "message": "Confirmation required. Add ?confirm=true to proceed",
                "warning": "This will reset ALL safes and remove ALL expenses!"
            }
        
        # Get all active safes
        safes = db.execute(text("SELECT id, name, initial_balance FROM safes WHERE is_active = 1")).fetchall()
        
        if not safes:
            return {
                "success": False,
                "message": "No active safes found"
            }
        
        reset_count = 0
        
        for safe in safes:
            safe_id = safe[0]
            initial_balance = safe[2] or 0.0
            
            # Remove all cheques from this safe
            db.execute(text("""
                UPDATE cheques 
                SET is_assigned_to_safe = 0, safe_id = NULL 
                WHERE safe_id = :safe_id
            """), {"safe_id": safe_id})
            
            # Delete all expenses from this safe
            db.execute(text("DELETE FROM expenses WHERE safe_id = :safe_id"), {"safe_id": safe_id})
            
            # Reset safe balance to initial balance
            db.execute(text("""
                UPDATE safes 
                SET current_balance = :initial_balance 
                WHERE id = :safe_id
            """), {"safe_id": safe_id, "initial_balance": initial_balance})
            
            reset_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully reset {reset_count} safes",
            "reset_count": reset_count,
            "safes_reset": [{"id": safe[0], "name": safe[1]} for safe in safes]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting all safes: {str(e)}")

@router.delete("/admin-simple/delete-all-cheques")
async def delete_all_cheques_simple(confirm: str = None, db: Session = Depends(get_db)):
    """Delete ALL cheques, expenses, and settlements - EXTREMELY DANGEROUS!"""
    try:
        if confirm != "true":
            return {
                "success": False,
                "message": "Confirmation required. Add ?confirm=true to proceed",
                "warning": "This will PERMANENTLY DELETE ALL cheques, expenses, and settlements!"
            }
        
        # Count records before deletion
        cheque_count = db.execute(text("SELECT COUNT(*) FROM cheques")).fetchone()[0]
        expense_count = db.execute(text("SELECT COUNT(*) FROM expenses")).fetchone()[0]
        settlement_count = db.execute(text("SELECT COUNT(*) FROM cheque_settlements")).fetchone()[0]
        
        # Delete all settlements first (foreign key constraints)
        db.execute(text("DELETE FROM cheque_settlements"))
        
        # Delete all expenses
        db.execute(text("DELETE FROM expenses"))
        
        # Delete all cheques
        db.execute(text("DELETE FROM cheques"))
        
        # Reset all safe balances to their initial balances
        db.execute(text("""
            UPDATE safes 
            SET current_balance = initial_balance 
            WHERE is_active = 1
        """))
        
        db.commit()
        
        return {
            "success": True,
            "message": "ALL DATA DELETED SUCCESSFULLY",
            "deleted_counts": {
                "cheques": cheque_count,
                "expenses": expense_count,
                "settlements": settlement_count
            },
            "warning": "This action cannot be undone!"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting all data: {str(e)}")

# Authenticated versions for extra security
@router.post("/admin/reset-safe/{safe_id}")
async def reset_safe_authenticated(
    safe_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reset a specific safe - authenticated version"""
    if current_user.role not in ["superAdmin", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Call the simple version
    return await reset_safe_simple(safe_id, db)

@router.post("/admin/reset-all-safes")
async def reset_all_safes_authenticated(
    confirm: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reset ALL safes - authenticated version"""
    if current_user.role not in ["superAdmin", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Call the simple version
    return await reset_all_safes_simple(confirm, db)

@router.delete("/admin/delete-all-cheques")
async def delete_all_cheques_authenticated(
    confirm: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete ALL cheques - authenticated version"""
    if current_user.role != "superAdmin":
        raise HTTPException(status_code=403, detail="Only super admin can perform this action")
    
    # Call the simple version
    return await delete_all_cheques_simple(confirm, db) 