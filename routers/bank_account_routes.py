from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

from database import get_db
from auth import get_current_active_user
from models import User

router = APIRouter(tags=["bank-accounts"])

# Pydantic models for bank accounts
class BankAccountCreate(BaseModel):
    bank_id: int
    account_name: str = Field(..., min_length=1, max_length=200)
    account_number: str = Field(..., min_length=1, max_length=100)
    iban: Optional[str] = Field(None, max_length=50)
    branch: Optional[str] = Field(None, max_length=100)
    branch_code: Optional[str] = Field(None, max_length=20)
    account_type: str = Field(default="checking", max_length=20)
    currency: str = Field(default="EGP", max_length=10)
    opening_balance: float = Field(default=0.0)
    overdraft_limit: float = Field(default=0.0)

class BankAccountUpdate(BaseModel):
    bank_id: Optional[int] = None
    account_name: Optional[str] = Field(None, min_length=1, max_length=200)
    account_number: Optional[str] = Field(None, min_length=1, max_length=100)
    iban: Optional[str] = Field(None, max_length=50)
    branch: Optional[str] = Field(None, max_length=100)
    branch_code: Optional[str] = Field(None, max_length=20)
    account_type: Optional[str] = Field(None, max_length=20)
    currency: Optional[str] = Field(None, max_length=10)
    opening_balance: Optional[float] = None
    overdraft_limit: Optional[float] = None
    is_active: Optional[bool] = None

@router.post("/bank-accounts")
async def create_bank_account(
    account_data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new bank account"""
    try:
        # Check if bank exists
        bank_check = db.execute(text("SELECT id, name FROM banks WHERE id = :bank_id AND is_active = 1"), 
                               {"bank_id": account_data.bank_id}).fetchone()
        if not bank_check:
            raise HTTPException(status_code=404, detail="Bank not found or inactive")
        
        # Check if account number already exists
        existing = db.execute(text("SELECT id FROM bank_accounts WHERE account_number = :number"), 
                              {"number": account_data.account_number}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Account number already exists")
        
        # Create bank account (using only existing columns)
        db.execute(text("""
            INSERT INTO bank_accounts (
                bank_id, account_name, account_number, branch, 
                account_type, currency, opening_balance, current_balance, 
                bank_name, is_active, created_by
            )
            VALUES (
                :bank_id, :account_name, :account_number, :branch,
                :account_type, :currency, :opening_balance, :current_balance,
                :bank_name, 1, :created_by
            )
        """), {
            "bank_id": account_data.bank_id,
            "account_name": account_data.account_name,
            "account_number": account_data.account_number,
            "branch": account_data.branch,
            "account_type": account_data.account_type,
            "currency": account_data.currency,
            "opening_balance": account_data.opening_balance,
            "current_balance": account_data.opening_balance,  # Initial balance
            "bank_name": bank_check[1],  # Use actual bank name
            "created_by": current_user.id
        })
        
        # Get the newly created account (using only existing columns)
        new_account = db.execute(text("""
            SELECT id, bank_id, account_name, account_number, branch,
                   account_type, currency, opening_balance, current_balance, is_active
            FROM bank_accounts 
            WHERE account_number = :number
        """), {"number": account_data.account_number}).fetchone()
        
        db.commit()
        
        return {
            "id": new_account[0],
            "bank_id": new_account[1],
            "account_name": new_account[2],
            "account_number": new_account[3],
            "iban": None,  # Column doesn't exist
            "branch": new_account[4],
            "branch_code": None,  # Column doesn't exist
            "account_type": new_account[5],
            "currency": new_account[6],
            "opening_balance": float(new_account[7]) if new_account[7] else 0.0,
            "current_balance": float(new_account[8]) if new_account[8] else 0.0,
            "overdraft_limit": 0.0,  # Column doesn't exist
            "is_active": bool(new_account[9])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/bank-accounts/{account_id}")
async def update_bank_account(
    account_id: int,
    account_update: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a bank account"""
    try:
        # Check if account exists
        account = db.execute(text("SELECT id FROM bank_accounts WHERE id = :id"), 
                            {"id": account_id}).fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        # Build update query dynamically
        update_fields = []
        update_params = {"id": account_id}
        
        # Check each field and add to update if provided
        if account_update.bank_id is not None:
            # Verify bank exists
            bank_check = db.execute(text("SELECT name FROM banks WHERE id = :bank_id AND is_active = 1"), 
                                   {"bank_id": account_update.bank_id}).fetchone()
            if not bank_check:
                raise HTTPException(status_code=404, detail="Bank not found or inactive")
            update_fields.append("bank_id = :bank_id")
            update_fields.append("bank_name = :bank_name")
            update_params["bank_id"] = account_update.bank_id
            update_params["bank_name"] = bank_check[0]
        
        if account_update.account_name is not None:
            update_fields.append("account_name = :account_name")
            update_params["account_name"] = account_update.account_name
        
        if account_update.account_number is not None:
            # Check for duplicates
            existing = db.execute(text("SELECT id FROM bank_accounts WHERE account_number = :number AND id != :id"), 
                                  {"number": account_update.account_number, "id": account_id}).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Account number already exists")
            update_fields.append("account_number = :account_number")
            update_params["account_number"] = account_update.account_number
        
        # Skip iban as column doesn't exist
        # if account_update.iban is not None:
        #     update_fields.append("iban = :iban")
        #     update_params["iban"] = account_update.iban
        
        if account_update.branch is not None:
            update_fields.append("branch = :branch")
            update_params["branch"] = account_update.branch
        
        # Skip branch_code as column doesn't exist  
        # if account_update.branch_code is not None:
        #     update_fields.append("branch_code = :branch_code")
        #     update_params["branch_code"] = account_update.branch_code
        
        if account_update.account_type is not None:
            update_fields.append("account_type = :account_type")
            update_params["account_type"] = account_update.account_type
        
        if account_update.currency is not None:
            update_fields.append("currency = :currency")
            update_params["currency"] = account_update.currency
        
        if account_update.opening_balance is not None:
            update_fields.append("opening_balance = :opening_balance")
            update_params["opening_balance"] = account_update.opening_balance
        
        # Skip overdraft_limit as column doesn't exist
        # if account_update.overdraft_limit is not None:
        #     update_fields.append("overdraft_limit = :overdraft_limit")
        #     update_params["overdraft_limit"] = account_update.overdraft_limit
        
        if account_update.is_active is not None:
            update_fields.append("is_active = :is_active")
            update_params["is_active"] = account_update.is_active
        
        # Execute update if there are fields to update
        if update_fields:
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE bank_accounts SET {', '.join(update_fields)} WHERE id = :id"
            db.execute(text(query), update_params)
        
        db.commit()
        
        # Return updated account (using only existing columns)
        updated_account = db.execute(text("""
            SELECT id, bank_id, account_name, account_number, branch,
                   account_type, currency, opening_balance, current_balance, is_active
            FROM bank_accounts 
            WHERE id = :id
        """), {"id": account_id}).fetchone()
        
        return {
            "id": updated_account[0],
            "bank_id": updated_account[1],
            "account_name": updated_account[2],
            "account_number": updated_account[3],
            "iban": None,  # Column doesn't exist
            "branch": updated_account[4],
            "branch_code": None,  # Column doesn't exist
            "account_type": updated_account[5],
            "currency": updated_account[6],
            "opening_balance": float(updated_account[7]) if updated_account[7] else 0.0,
            "current_balance": float(updated_account[8]) if updated_account[8] else 0.0,
            "overdraft_limit": 0.0,  # Column doesn't exist
            "is_active": bool(updated_account[9])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a bank account (only if no cheques exist)"""
    try:
        # Check if account exists
        account = db.execute(text("SELECT account_name FROM bank_accounts WHERE id = :id"), 
                            {"id": account_id}).fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        # Check if account has any cheques
        cheques = db.execute(text("SELECT COUNT(*) FROM cheques WHERE bank_account_id = :id"), 
                            {"id": account_id}).fetchone()
        if cheques and cheques[0] > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete account. It has {cheques[0]} cheque(s). Delete all cheques first."
            )
        
        # Delete the account
        db.execute(text("DELETE FROM bank_accounts WHERE id = :id"), {"id": account_id})
        db.commit()
        
        return {
            "success": True,
            "message": f"Bank account '{account[0]}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 