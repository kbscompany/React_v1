from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

from database import get_db
from auth import get_current_active_user
from models import User, Bank, BankAccount, ChequeBook, Cheque

router = APIRouter(prefix="/cheque-books", tags=["cheque-books"])

# Pydantic models
class ChequeBookCreate(BaseModel):
    book_number: str = Field(..., min_length=1, max_length=50)
    bank_account_id: int
    start_cheque_number: str = Field(..., min_length=1, max_length=50)
    end_cheque_number: str = Field(..., min_length=1, max_length=50)
    prefix: Optional[str] = Field(None, max_length=10)
    series: Optional[str] = Field(None, max_length=10)
    book_type: str = Field(default="standard", max_length=20)

class ChequeBookClose(BaseModel):
    reason: Optional[str] = None

@router.get("/")
async def get_cheque_books(
    bank_account_id: Optional[int] = None,
    status: Optional[str] = None,
    include_closed: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get all cheque books with optional filtering"""
    query = db.query(ChequeBook).options(
        joinedload(ChequeBook.bank_account).joinedload(BankAccount.bank),
        joinedload(ChequeBook.cheques),
        joinedload(ChequeBook.creator),
        joinedload(ChequeBook.closer)
    )
    
    if bank_account_id:
        query = query.filter(ChequeBook.bank_account_id == bank_account_id)
    
    if status:
        query = query.filter(ChequeBook.status == status)
    
    if not include_closed:
        query = query.filter(ChequeBook.status != 'closed')
    
    books = query.order_by(ChequeBook.created_at.desc()).all()
    
    result = []
    for book in books:
        summary = book.cheques_summary
        result.append({
            "id": book.id,
            "book_number": book.book_number,
            "bank_account_id": book.bank_account_id,
            "bank_account_name": book.bank_account.account_name,
            "bank_name": book.bank.name if book.bank else None,
            "bank_short_name": book.bank.short_name if book.bank else None,
            "start_cheque_number": book.start_cheque_number,
            "end_cheque_number": book.end_cheque_number,
            "total_cheques": book.total_cheques,
            "prefix": book.prefix,
            "series": book.series,
            "book_type": book.book_type,
            "status": book.status,
            "issued_date": book.issued_date.isoformat() if book.issued_date else None,
            "activated_date": book.activated_date.isoformat() if book.activated_date else None,
            "closed_date": book.closed_date.isoformat() if book.closed_date else None,
            "closed_reason": book.closed_reason,
            "can_be_closed": book.can_be_closed,
            "usage_percentage": book.usage_percentage,
            "cheques_summary": summary,
            "creator": book.creator.username if book.creator else None,
            "closer": book.closer.username if book.closer else None
        })
    
    return result

@router.get("/active/{bank_account_id}")
async def get_active_cheque_book(
    bank_account_id: int,
    db: Session = Depends(get_db)
):
    """Get the active cheque book for a bank account"""
    book = db.query(ChequeBook).options(
        joinedload(ChequeBook.cheques)
    ).filter(
        and_(
            ChequeBook.bank_account_id == bank_account_id,
            ChequeBook.status == 'active'
        )
    ).first()
    
    if not book:
        return {"active_book": None}
    
    summary = book.cheques_summary
    return {
        "active_book": {
            "id": book.id,
            "book_number": book.book_number,
            "start_cheque_number": book.start_cheque_number,
            "end_cheque_number": book.end_cheque_number,
            "total_cheques": book.total_cheques,
            "prefix": book.prefix,
            "series": book.series,
            "book_type": book.book_type,
            "status": book.status,
            "issued_date": book.issued_date.isoformat() if book.issued_date else None,
            "activated_date": book.activated_date.isoformat() if book.activated_date else None,
            "can_be_closed": book.can_be_closed,
            "usage_percentage": book.usage_percentage,
            "cheques_summary": summary
        }
    }

@router.post("/")
async def create_cheque_book(
    book_data: ChequeBookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new cheque book with business logic validation"""
    
    # Check if bank account exists
    bank_account = db.query(BankAccount).filter(BankAccount.id == book_data.bank_account_id).first()
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    if not bank_account.is_active:
        raise HTTPException(status_code=400, detail="Cannot create cheque book for inactive bank account")
    
    # Check if there's already an active cheque book for this account
    existing_active = db.query(ChequeBook).filter(
        and_(
            ChequeBook.bank_account_id == book_data.bank_account_id,
            ChequeBook.status == 'active'
        )
    ).first()
    
    if existing_active:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot create new cheque book. Active cheque book '{existing_active.book_number}' must be closed first."
        )
    
    # Validate cheque number range
    try:
        # Extract numeric parts for validation
        start_num_str = book_data.start_cheque_number.replace(book_data.prefix or '', '')
        end_num_str = book_data.end_cheque_number.replace(book_data.prefix or '', '')
        
        start_num = int(start_num_str)
        end_num = int(end_num_str)
        
        if start_num >= end_num:
            raise HTTPException(status_code=400, detail="Start cheque number must be less than end cheque number")
        
        total_cheques = end_num - start_num + 1
        if total_cheques > 1000:
            raise HTTPException(status_code=400, detail="Cannot create more than 1000 cheques per book")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cheque number format")
    
    # Check if book number already exists
    existing_book = db.query(ChequeBook).filter(ChequeBook.book_number == book_data.book_number).first()
    if existing_book:
        raise HTTPException(status_code=400, detail="Cheque book number already exists")
    
    # Create the cheque book
    new_book = ChequeBook(
        book_number=book_data.book_number,
        bank_account_id=book_data.bank_account_id,
        start_cheque_number=book_data.start_cheque_number,
        end_cheque_number=book_data.end_cheque_number,
        total_cheques=total_cheques,
        prefix=book_data.prefix,
        series=book_data.series,
        book_type=book_data.book_type,
        created_by=current_user.id
    )
    
    db.add(new_book)
    db.flush()  # Get the ID
    
    # Create all cheques for this book
    cheques_created = []
    for num in range(start_num, end_num + 1):
        cheque_number = f"{book_data.prefix or ''}{str(num).zfill(len(start_num_str))}"
        
        # Check if cheque number already exists
        existing_cheque = db.query(Cheque).filter(Cheque.cheque_number == cheque_number).first()
        if existing_cheque:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Cheque number {cheque_number} already exists"
            )
        
        cheque = Cheque(
            cheque_number=cheque_number,
            cheque_book_id=new_book.id,
            bank_account_id=book_data.bank_account_id,
            amount=0.00,  # Blank cheques
            issue_date=func.now(),
            description=f"Cheque from book {book_data.book_number}",
            created_by=current_user.id,
            status="created"
        )
        db.add(cheque)
        cheques_created.append(cheque_number)
    
    try:
        db.commit()
        db.refresh(new_book)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": True,
        "message": f"Cheque book '{book_data.book_number}' created successfully",
        "cheque_book": {
            "id": new_book.id,
            "book_number": new_book.book_number,
            "total_cheques": total_cheques,
            "cheques_created": cheques_created[:5] + ['...'] if len(cheques_created) > 5 else cheques_created,
            "total_created": len(cheques_created)
        }
    }

@router.post("/{book_id}/close")
async def close_cheque_book(
    book_id: int,
    close_data: ChequeBookClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Close a cheque book with validation"""
    
    # Get the cheque book
    book = db.query(ChequeBook).options(
        joinedload(ChequeBook.cheques)
    ).filter(ChequeBook.id == book_id).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Cheque book not found")
    
    if book.status != 'active':
        raise HTTPException(status_code=400, detail="Only active cheque books can be closed")
    
    # Check if all cheques are settled or cancelled
    if not book.can_be_closed:
        active_cheques = [c for c in book.cheques if c.status not in ['settled', 'cancelled']]
        
        active_list = [f"{c.cheque_number} ({c.status})" for c in active_cheques[:5]]
        if len(active_cheques) > 5:
            active_list.append(f"... and {len(active_cheques) - 5} more")
            
        raise HTTPException(
            status_code=400,
            detail=f"Cannot close cheque book. {len(active_cheques)} cheques are not settled or cancelled. Examples: {', '.join(active_list)}"
        )
    
    # Close the cheque book
    book.status = 'closed'
    book.closed_date = func.now()
    book.closed_by = current_user.id
    book.closed_reason = close_data.reason
    
    try:
        db.commit()
        db.refresh(book)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    summary = book.cheques_summary
    return {
        "success": True,
        "message": f"Cheque book '{book.book_number}' closed successfully",
        "cheques_summary": summary,
        "closed_by": current_user.username,
        "closed_date": book.closed_date.isoformat() if book.closed_date else None
    }

@router.get("/{book_id}")
async def get_cheque_book_detail(
    book_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific cheque book"""
    book = db.query(ChequeBook).options(
        joinedload(ChequeBook.bank_account).joinedload(BankAccount.bank),
        joinedload(ChequeBook.cheques).joinedload(Cheque.safe),
        joinedload(ChequeBook.creator),
        joinedload(ChequeBook.closer)
    ).filter(ChequeBook.id == book_id).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Cheque book not found")
    
    # Get detailed cheque information
    cheques_detail = []
    for cheque in sorted(book.cheques, key=lambda c: c.cheque_number):
        cheques_detail.append({
            "id": cheque.id,
            "cheque_number": cheque.cheque_number,
            "amount": float(cheque.amount),
            "status": cheque.status,
            "safe_id": cheque.safe_id,
            "safe_name": cheque.safe.name if cheque.safe else None,
            "total_expenses": float(cheque.total_expenses),
            "remaining_amount": float(cheque.remaining_amount),
            "is_overspent": cheque.is_overspent,
            "is_settled": cheque.is_settled,
            "issued_to": cheque.issued_to,
            "issue_date": cheque.issue_date.isoformat() if cheque.issue_date else None,
            "settlement_date": cheque.settlement_date.isoformat() if cheque.settlement_date else None
        })
    
    return {
        "book": {
            "id": book.id,
            "book_number": book.book_number,
            "bank_account": {
                "id": book.bank_account.id,
                "account_name": book.bank_account.account_name,
                "account_number": book.bank_account.account_number,
                "bank_name": book.bank.name if book.bank else None,
                "bank_short_name": book.bank.short_name if book.bank else None
            },
            "start_cheque_number": book.start_cheque_number,
            "end_cheque_number": book.end_cheque_number,
            "total_cheques": book.total_cheques,
            "prefix": book.prefix,
            "series": book.series,
            "book_type": book.book_type,
            "status": book.status,
            "issued_date": book.issued_date.isoformat() if book.issued_date else None,
            "activated_date": book.activated_date.isoformat() if book.activated_date else None,
            "closed_date": book.closed_date.isoformat() if book.closed_date else None,
            "closed_reason": book.closed_reason,
            "can_be_closed": book.can_be_closed,
            "usage_percentage": book.usage_percentage,
            "summary": book.cheques_summary,
            "creator": book.creator.username if book.creator else None,
            "closer": book.closer.username if book.closer else None
        },
        "cheques": cheques_detail
    }

@router.get("/{book_id}/cheques")
async def get_cheque_book_cheques(
    book_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all cheques in a specific cheque book"""
    
    # Verify book exists
    book = db.query(ChequeBook).filter(ChequeBook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Cheque book not found")
    
    query = db.query(Cheque).options(
        joinedload(Cheque.safe)
    ).filter(Cheque.cheque_book_id == book_id)
    
    if status:
        query = query.filter(Cheque.status == status)
    
    cheques = query.order_by(Cheque.cheque_number).all()
    
    result = []
    for cheque in cheques:
        result.append({
            "id": cheque.id,
            "cheque_number": cheque.cheque_number,
            "amount": float(cheque.amount),
            "status": cheque.status,
            "total_expenses": float(cheque.total_expenses or 0),
            "remaining_amount": float(cheque.remaining_amount),
            "is_overspent": cheque.is_overspent,
            "is_settled": cheque.is_settled,
            "safe_id": cheque.safe_id,
            "safe_name": cheque.safe.name if cheque.safe else None,
            "created_at": cheque.created_at.isoformat() if cheque.created_at else None,
            "settlement_date": cheque.settlement_date.isoformat() if cheque.settlement_date else None
        })
    
    return {
        "cheque_book": {
            "id": book.id,
            "book_number": book.book_number,
            "status": book.status
        },
        "cheques": result,
        "total_count": len(result)
    }

@router.post("/{book_id}/cancel")
async def cancel_cheque_book(
    book_id: int,
    close_data: ChequeBookClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a cheque book (mark as cancelled instead of closed)"""
    
    # Check permissions - only admins can cancel
    if current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Only administrators can cancel cheque books")
    
    # Get the cheque book
    book = db.query(ChequeBook).options(
        joinedload(ChequeBook.cheques)
    ).filter(ChequeBook.id == book_id).first()
    
    if not book:
        raise HTTPException(status_code=404, detail="Cheque book not found")
    
    if book.status == 'cancelled':
        raise HTTPException(status_code=400, detail="Cheque book is already cancelled")
    
    if book.status == 'closed':
        raise HTTPException(status_code=400, detail="Cannot cancel a closed cheque book")
    
    # Check if any cheques have been used
    used_cheques = [c for c in book.cheques if c.status != 'created']
    if used_cheques:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel cheque book. {len(used_cheques)} cheque(s) have been used."
        )
    
    # Cancel the cheque book and all its cheques
    book.status = 'cancelled'
    book.closed_date = func.now()
    book.closed_by = current_user.id
    book.closed_reason = close_data.reason or "Cancelled by administrator"
    
    # Cancel all cheques in the book
    for cheque in book.cheques:
        if cheque.status == 'created':
            cheque.status = 'cancelled'
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "success": True,
        "message": f"Cheque book '{book.book_number}' cancelled successfully",
        "cancelled_cheques": len(book.cheques)
    } 