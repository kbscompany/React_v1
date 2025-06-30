from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_active_user
from models import User

router = APIRouter(prefix="/cheques", tags=["cheques"])

@router.put("/{cheque_id}")
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

@router.post("/assign-to-safe")
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

@router.get("/unassigned")
async def get_unassigned_cheques(db: Session = Depends(get_db)):
    """Get all unassigned cheques"""
    try:
        result = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.description,
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
                "bank_account": f"{row[4]} ({row[5]})" if row[4] else "Unknown",
                "bank_account_id": row[6]
            })
        
        return cheques
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{cheque_id}/settle")
async def settle_overspent_cheque(
    cheque_id: int,
    settlement_data: dict,
    db: Session = Depends(get_db)
):
    """Settle an overspent cheque by creating a new cheque"""
    try:
        # Get the overspent cheque details
        overspent_cheque = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.status, 
                   c.total_expenses, c.overspent_amount, c.safe_id,
                   c.is_settled, c.bank_account_id, c.cheque_book_id
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id}).fetchone()
        
        if not overspent_cheque:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        if overspent_cheque[7]:  # is_settled
            raise HTTPException(status_code=400, detail="Cheque is already settled")
        
        if overspent_cheque[3] != 'overspent':  # status
            raise HTTPException(status_code=400, detail="Cheque is not overspent")
        
        overspent_amount = float(overspent_cheque[5])
        safe_id = overspent_cheque[6]
        
        # Get settlement details from request
        settlement_cheque_number = settlement_data.get("cheque_number")
        bank_account_id = settlement_data.get("bank_account_id", overspent_cheque[8])
        notes = settlement_data.get("notes", f"Settlement for overspent cheque {overspent_cheque[1]}")
        
        if not settlement_cheque_number:
            raise HTTPException(status_code=400, detail="Settlement cheque number is required")
        
        # Check if settlement cheque number already exists
        existing = db.execute(text("SELECT id FROM cheques WHERE cheque_number = :number"), 
                             {"number": settlement_cheque_number}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Settlement cheque number already exists")
        
        # Create settlement cheque with proper cheque_book_id
        # First, try to find active cheque book for the bank account
        active_book = db.execute(text("""
            SELECT id FROM cheque_books 
            WHERE bank_account_id = :bank_account_id AND status = 'active'
            LIMIT 1
        """), {"bank_account_id": bank_account_id}).fetchone()
        
        settlement_book_id = active_book[0] if active_book else cheque_book_id
        
        # Create settlement cheque
        db.execute(text("""
            INSERT INTO cheques (
                cheque_number, bank_account_id, cheque_book_id, amount, safe_id,
                description, status, is_assigned_to_safe, is_settled,
                issue_date, total_expenses
            ) VALUES (
                :cheque_number, :bank_account_id, :cheque_book_id, :amount, :safe_id,
                :description, 'assigned', 1, 0,
                CURRENT_TIMESTAMP, 0
            )
        """), {
            "cheque_number": settlement_cheque_number,
            "bank_account_id": bank_account_id,
            "cheque_book_id": settlement_book_id,
            "amount": overspent_amount,
            "safe_id": safe_id,
            "description": notes
        })
        
        # Get the ID of the newly created settlement cheque
        settlement_cheque_id = db.execute(text(
            "SELECT id FROM cheques WHERE cheque_number = :number"
        ), {"number": settlement_cheque_number}).fetchone()[0]
        
        # Get cheque_book_id from the overspent cheque for the settlement cheque
        cheque_book_id = overspent_cheque[9] if len(overspent_cheque) > 9 else None
        
        # Update the overspent cheque
        db.execute(text("""
            UPDATE cheques 
            SET is_settled = 1, 
                status = 'settled',
                settled_by_cheque_id = :settlement_cheque_id,
                settlement_date = CURRENT_TIMESTAMP
            WHERE id = :cheque_id
        """), {
            "settlement_cheque_id": settlement_cheque_id,
            "cheque_id": cheque_id
        })
        
        # Update safe balance (add the settlement amount back)
        db.execute(text("""
            UPDATE safes 
            SET current_balance = current_balance + :amount
            WHERE id = :safe_id
        """), {
            "amount": overspent_amount,
            "safe_id": safe_id
        })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Cheque {overspent_cheque[1]} settled successfully",
            "settlement_cheque": {
                "id": settlement_cheque_id,
                "cheque_number": settlement_cheque_number,
                "amount": overspent_amount
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{cheque_id}/cancel")
async def cancel_cheque(
    cheque_id: int,
    cancel_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a cheque with proper permission checking"""
    try:
        # Check user permissions - only Admin, Manager, and Accountant can cancel cheques
        # Role IDs: 1=Admin, 2=Manager/Warehouse Manager, 3=Staff (includes Accountant)
        # For simplicity, we'll allow roles 1, 2, and 3 to cancel cheques
        # Super admin would have role_id = 1 (Admin) in this system
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