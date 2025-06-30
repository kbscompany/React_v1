from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime

from database import get_db
from auth import get_current_active_user
from models import User, Bank, BankAccount, ChequeBook

router = APIRouter(prefix="/banks", tags=["banks"])

# Pydantic models
class BankCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    short_name: str = Field(..., min_length=2, max_length=20)
    swift_code: Optional[str] = Field(None, max_length=20)
    country: str = Field(default="Egypt", max_length=50)
    address: Optional[str] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=200)

class BankUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    short_name: Optional[str] = Field(None, min_length=2, max_length=20)
    swift_code: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None

@router.get("/")
async def get_banks(
    include_inactive: bool = Query(default=False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all banks with statistics"""
    try:
        # Build query parameters safely
        query_params = {}
        
        # Base query
        base_query = """
            SELECT id, name, branch, swift_code, address, phone, contact_person, is_active, created_at, updated_at
            FROM banks 
        """
        
        # Build WHERE conditions
        conditions = []
        if not include_inactive:
            conditions.append("is_active = 1")
        
        if search:
            conditions.append("(name LIKE :search_term OR swift_code LIKE :search_term)")
            query_params["search_term"] = f"%{search}%"
        
        # Combine query
        if conditions:
            banks_query = base_query + "WHERE " + " AND ".join(conditions) + " ORDER BY name"
        else:
            banks_query = base_query + "ORDER BY name"
        
        banks_result = db.execute(text(banks_query), query_params).fetchall()
        
        result = []
        for bank in banks_result:
            # Get account statistics for this bank
            stats_result = db.execute(text("""
                SELECT 
                    COUNT(*) as total_accounts,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_accounts
                FROM bank_accounts 
                WHERE bank_id = :bank_id
            """), {"bank_id": bank[0]}).fetchone()
            
            # Get actual bank accounts for this bank (using only existing columns)
            accounts_result = db.execute(text("""
                SELECT id, account_name, account_number, branch, account_type, 
                       currency, opening_balance, current_balance, is_active
                FROM bank_accounts 
                WHERE bank_id = :bank_id
                ORDER BY account_name
            """), {"bank_id": bank[0]}).fetchall()
            
            # Build bank accounts array
            bank_accounts = []
            for acc in accounts_result:
                bank_accounts.append({
                    "id": acc[0],
                    "bank_id": bank[0],
                    "account_name": acc[1],
                    "account_number": acc[2],
                    "iban": None,  # Column doesn't exist
                    "branch": acc[3],
                    "branch_code": None,  # Column doesn't exist
                    "account_type": acc[4],
                    "currency": acc[5] or "EGP",
                    "opening_balance": float(acc[6]) if acc[6] else 0.0,
                    "current_balance": float(acc[7]) if acc[7] else 0.0,
                    "overdraft_limit": 0.0,  # Column doesn't exist
                    "is_active": bool(acc[8]),
                    "cheque_books": []  # Simplified for now, can be expanded later
                })
            
            total_accounts = stats_result[0] if stats_result else 0
            active_accounts = stats_result[1] if stats_result else 0
            
            result.append({
                "id": bank[0],
                "name": bank[1],
                "short_name": bank[1][:20] if bank[1] else "",  # Use truncated name as short_name
                "swift_code": bank[2],
                "country": "Egypt",  # Default value since column doesn't exist
                "is_active": bool(bank[7]),
                "bank_accounts": bank_accounts,  # Include nested accounts
                "statistics": {
                    "total_accounts": total_accounts,
                    "active_accounts": active_accounts,
                    "total_cheque_books": 0,  # Simplified for now
                    "active_cheque_books": 0  # Simplified for now
                },
                "contact": {
                    "address": bank[4],
                    "phone": bank[5],
                    "email": None,  # Column doesn't exist
                    "website": None  # Column doesn't exist
                },
                "created_at": bank[8].isoformat() if bank[8] else None,
                "updated_at": bank[9].isoformat() if bank[9] else None
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{bank_id}")
async def get_bank_detail(
    bank_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific bank"""
    bank = db.query(Bank).options(
        joinedload(Bank.bank_accounts).joinedload(BankAccount.cheque_books).joinedload(ChequeBook.cheques)
    ).filter(Bank.id == bank_id).first()
    
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Compile detailed account information
    accounts = []
    for account in bank.bank_accounts:
        active_book = account.active_cheque_book
        accounts.append({
            "id": account.id,
            "account_name": account.account_name,
            "account_number": account.account_number,
            "iban": account.iban,
            "branch": account.branch,
            "branch_code": account.branch_code,
            "account_type": account.account_type,
            "currency": account.currency,
            "current_balance": float(account.current_balance),
            "overdraft_limit": float(account.overdraft_limit),
            "available_balance": account.available_balance,
            "is_active": account.is_active,
            "active_cheque_book": {
                "id": active_book.id,
                "book_number": active_book.book_number,
                "cheques_remaining": len([c for c in active_book.cheques if c.status == 'created'])
            } if active_book else None,
            "total_cheque_books": len(account.cheque_books),
            "total_cheques_issued": account.total_cheques_issued
        })
    
    return {
        "bank": {
            "id": bank.id,
            "name": bank.name,
            "short_name": bank.short_name,
            "swift_code": bank.swift_code,
            "country": bank.country,
            "is_active": bank.is_active,
            "contact": {
                "address": bank.address,
                "phone": bank.contact_phone,
                "email": bank.contact_email,
                "website": bank.website
            }
        },
        "accounts": accounts,
        "summary": {
            "total_accounts": len(accounts),
            "active_accounts": len([a for a in accounts if a["is_active"]]),
            "total_balance": sum(a["current_balance"] for a in accounts),
            "total_available": sum(a["available_balance"] for a in accounts),
            "currencies": list(set(a["currency"] for a in accounts))
        }
    }

@router.post("/")
async def create_bank(
    bank_data: BankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new bank"""
    # Check permissions (assuming admin only)
    if current_user.role_id not in [1, 2]:  # Admin or Manager
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if bank name already exists
    existing = db.execute(text("SELECT id FROM banks WHERE name = :name"), 
                         {"name": bank_data.name}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Bank name already exists")
    
    # Validate email format if provided
    if bank_data.contact_email:
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, bank_data.contact_email):
            raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Create new bank using raw SQL (only columns that exist)
    try:
        result = db.execute(text("""
            INSERT INTO banks (name, branch, swift_code, address, phone, contact_person, is_active)
            VALUES (:name, :branch, :swift_code, :address, :phone, :contact_person, 1)
        """), {
            "name": bank_data.name,
            "branch": "",  # Default empty
            "swift_code": bank_data.swift_code or "",
            "address": bank_data.address or "",
            "phone": bank_data.contact_phone or "",
            "contact_person": ""  # Default empty
        })
        
        # Get the newly created bank ID
        new_bank_id = result.lastrowid
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Bank '{bank_data.name}' created successfully",
            "bank": {
                "id": new_bank_id,
                "name": bank_data.name,
                "short_name": bank_data.short_name,
                "swift_code": bank_data.swift_code
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{bank_id}")
async def update_bank(
    bank_id: int,
    bank_update: BankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update bank information"""
    # Check permissions
    if current_user.role_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if bank exists
    bank = db.execute(text("SELECT id, name FROM banks WHERE id = :id"), 
                     {"id": bank_id}).fetchone()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Build update query dynamically
    update_fields = []
    update_params = {"id": bank_id}
    
    if bank_update.name is not None:
        # Check for duplicate name
        existing = db.execute(text("SELECT id FROM banks WHERE name = :name AND id != :id"), 
                            {"name": bank_update.name, "id": bank_id}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Bank name already exists")
        update_fields.append("name = :name")
        update_params["name"] = bank_update.name
    
    if bank_update.swift_code is not None:
        update_fields.append("swift_code = :swift_code")
        update_params["swift_code"] = bank_update.swift_code
    
    if bank_update.address is not None:
        update_fields.append("address = :address")
        update_params["address"] = bank_update.address
    
    if bank_update.contact_phone is not None:
        update_fields.append("phone = :phone")
        update_params["phone"] = bank_update.contact_phone
    
    if bank_update.is_active is not None:
        update_fields.append("is_active = :is_active")
        update_params["is_active"] = bank_update.is_active
    
    if not update_fields:
        return {"success": True, "message": "No fields to update"}
    
    try:
        query = f"UPDATE banks SET {', '.join(update_fields)} WHERE id = :id"
        db.execute(text(query), update_params)
        db.commit()
        
        # Get updated bank info
        updated_bank = db.execute(text("SELECT id, name, swift_code, is_active FROM banks WHERE id = :id"), 
                                 {"id": bank_id}).fetchone()
        
        return {
            "success": True,
            "message": f"Bank updated successfully",
            "bank": {
                "id": updated_bank[0],
                "name": updated_bank[1],
                "short_name": bank_update.short_name or updated_bank[1][:20],
                "is_active": bool(updated_bank[3])
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{bank_id}/hierarchy")
async def get_bank_hierarchy(
    bank_id: int,
    db: Session = Depends(get_db)
):
    """Get complete hierarchy: Bank → Accounts → Cheque Books → Summary"""
    bank = db.query(Bank).options(
        joinedload(Bank.bank_accounts)
        .joinedload(BankAccount.cheque_books)
        .joinedload(ChequeBook.cheques)
    ).filter(Bank.id == bank_id).first()
    
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    hierarchy = {
        "bank": {
            "id": bank.id,
            "name": bank.name,
            "short_name": bank.short_name
        },
        "accounts": []
    }
    
    for account in bank.bank_accounts:
        account_data = {
            "id": account.id,
            "account_name": account.account_name,
            "account_number": account.account_number,
            "account_type": account.account_type,
            "currency": account.currency,
            "is_active": account.is_active,
            "cheque_books": []
        }
        
        for book in account.cheque_books:
            book_data = {
                "id": book.id,
                "book_number": book.book_number,
                "status": book.status,
                "total_cheques": book.total_cheques,
                "usage_percentage": book.usage_percentage,
                "summary": book.cheques_summary
            }
            account_data["cheque_books"].append(book_data)
        
        hierarchy["accounts"].append(account_data)
    
    return hierarchy

@router.delete("/{bank_id}")
async def delete_bank(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a bank (only if no accounts exist)"""
    # Check permissions
    if current_user.role_id != 1:  # Admin only
        raise HTTPException(status_code=403, detail="Only administrators can delete banks")
    
    # Check if bank exists
    bank = db.execute(text("SELECT id, name FROM banks WHERE id = :id"), 
                     {"id": bank_id}).fetchone()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    
    # Check if bank has any accounts
    account_count = db.execute(text("SELECT COUNT(*) FROM bank_accounts WHERE bank_id = :bank_id"), 
                              {"bank_id": bank_id}).fetchone()
    if account_count and account_count[0] > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete bank. It has {account_count[0]} account(s). Delete all accounts first."
        )
    
    # Delete the bank
    try:
        db.execute(text("DELETE FROM banks WHERE id = :id"), {"id": bank_id})
        db.commit()
        
        return {
            "success": True,
            "message": f"Bank '{bank[1]}' deleted successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 