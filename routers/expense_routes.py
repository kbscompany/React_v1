from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, date
import schemas
import models
from database import get_db
from auth import get_current_active_user
from html_expense_summary import generate_expense_summary_html
import tempfile
import os

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.get("", summary="Get expenses")
async def get_expenses(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get expenses with limit"""
    try:
        result = db.execute(text("""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, 
                   ec.name as category_name, s.name as safe_name, e.paid_to
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT :limit
        """), {"limit": limit})
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "category_name": row[5] or "Uncategorized",
                "safe_name": row[6] or "Unknown Safe",
                "paid_to": row[7] or ""
            })
        
        return {
            "success": True,
            "count": len(expenses),
            "data": expenses
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.get("/search", summary="Search expenses with filters")
async def search_expenses(
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    cheque_id: Optional[int] = Query(None, description="Filter by cheque ID"),
    cheque_number: Optional[str] = Query(None, description="Filter by cheque number"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    safe_id: Optional[int] = Query(None, description="Filter by safe ID"),
    search_term: Optional[str] = Query(None, description="Search in description"),
    limit: int = Query(100, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Search expenses with multiple filters"""
    try:
        # Build dynamic query
        where_conditions = []
        params = {}
        
        # Date range filter
        if from_date:
            where_conditions.append("e.expense_date >= :from_date")
            params["from_date"] = from_date
        if to_date:
            where_conditions.append("e.expense_date <= :to_date")
            params["to_date"] = to_date
        
        # Cheque filters
        if cheque_id:
            where_conditions.append("e.cheque_id = :cheque_id")
            params["cheque_id"] = cheque_id
        if cheque_number:
            where_conditions.append("c.cheque_number LIKE :cheque_number")
            params["cheque_number"] = f"%{cheque_number}%"
        
        # Other filters
        if category_id:
            where_conditions.append("e.category_id = :category_id")
            params["category_id"] = category_id
        if status:
            where_conditions.append("e.status = :status")
            params["status"] = status
        if safe_id:
            where_conditions.append("e.safe_id = :safe_id")
            params["safe_id"] = safe_id
        if search_term:
            where_conditions.append("(e.description LIKE :search_term OR e.notes LIKE :search_term)")
            params["search_term"] = f"%{search_term}%"
        
        # Build WHERE clause
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Set limit
        params["limit"] = limit
        
        # Execute query
        query = f"""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, e.notes,
                   ec.name as category_name, s.name as safe_name, c.cheque_number,
                   e.cheque_id, e.category_id, e.safe_id, e.paid_to
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            LEFT JOIN cheques c ON e.cheque_id = c.id
            {where_clause}
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT :limit
        """
        
        result = db.execute(text(query), params)
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "notes": row[5] or "",
                "category_name": row[6] or "Uncategorized",
                "safe_name": row[7] or "Unknown Safe",
                "cheque_number": row[8] or "N/A",
                "cheque_id": row[9],
                "category_id": row[10],
                "safe_id": row[11],
                "paid_to": row[12] or ""
            })
        
        return {
            "success": True,
            "count": len(expenses),
            "filters": {
                "from_date": from_date,
                "to_date": to_date,
                "cheque_id": cheque_id,
                "cheque_number": cheque_number,
                "category_id": category_id,
                "status": status,
                "safe_id": safe_id,
                "search_term": search_term
            },
            "data": expenses
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.post("/summary/html", response_class=HTMLResponse, summary="Generate HTML expense summary")
async def generate_expense_summary_html_endpoint(
    request_data: dict,
    language: str = Query("ar", description="Language (ar/en)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Generate HTML summary for selected expenses"""
    try:
        expense_ids = request_data.get("expense_ids", [])
        summary_info = request_data.get("summary_info", {})
        
        if not expense_ids:
            raise HTTPException(status_code=400, detail="No expense IDs provided")
        
        # Get expense details
        placeholders = ",".join([":id" + str(i) for i in range(len(expense_ids))])
        params = {f"id{i}": expense_id for i, expense_id in enumerate(expense_ids)}
        
        query = f"""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, e.notes,
                   ec.name as category_name, s.name as safe_name, c.cheque_number
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            LEFT JOIN cheques c ON e.cheque_id = c.id
            WHERE e.id IN ({placeholders})
            ORDER BY e.expense_date DESC, e.id DESC
        """
        
        result = db.execute(text(query), params)
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "notes": row[5] or "",
                "category_name": row[6] or "Uncategorized",
                "safe_name": row[7] or "Unknown Safe",
                "cheque_number": row[8] or "N/A"
            })
        
        if not expenses:
            raise HTTPException(status_code=404, detail="No expenses found")
        
        # Generate HTML
        html_content = generate_expense_summary_html(expenses, summary_info, language)
        
        return HTMLResponse(content=html_content, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate expense summary: {str(e)}")

@router.post("/summary/download", response_class=FileResponse, summary="Download HTML expense summary")
async def download_expense_summary_html(
    request_data: dict,
    language: str = Query("ar", description="Language (ar/en)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Download HTML summary for selected expenses"""
    try:
        expense_ids = request_data.get("expense_ids", [])
        summary_info = request_data.get("summary_info", {})
        
        if not expense_ids:
            raise HTTPException(status_code=400, detail="No expense IDs provided")
        
        # Get expense details (same query as above)
        placeholders = ",".join([":id" + str(i) for i in range(len(expense_ids))])
        params = {f"id{i}": expense_id for i, expense_id in enumerate(expense_ids)}
        
        query = f"""
            SELECT e.id, e.description, e.amount, e.expense_date, e.status, e.notes,
                   ec.name as category_name, s.name as safe_name, c.cheque_number
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN safes s ON e.safe_id = s.id
            LEFT JOIN cheques c ON e.cheque_id = c.id
            WHERE e.id IN ({placeholders})
            ORDER BY e.expense_date DESC, e.id DESC
        """
        
        result = db.execute(text(query), params)
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row[0],
                "description": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "expense_date": row[3].isoformat() if row[3] else None,
                "status": row[4] or "pending",
                "notes": row[5] or "",
                "category_name": row[6] or "Uncategorized",
                "safe_name": row[7] or "Unknown Safe",
                "cheque_number": row[8] or "N/A"
            })
        
        if not expenses:
            raise HTTPException(status_code=404, detail="No expenses found")
        
        # Generate HTML
        html_content = generate_expense_summary_html(expenses, summary_info, language)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_file = f.name
        
        # Generate filename
        date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"expense_summary_{date_str}.html"
        
        return FileResponse(
            path=temp_file,
            filename=filename,
            media_type='text/html',
            background=None  # Don't delete file immediately
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate expense summary: {str(e)}")

@router.get("/summary", summary="Get expense summary")
async def get_expenses_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get expense summary statistics"""
    try:
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_expenses,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_amount,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
            FROM expenses
            WHERE expense_date >= CURDATE() - INTERVAL 30 DAY
        """))
        
        row = result.fetchone()
        
        return {
            "success": True,
            "summary": {
                "total_expenses": row[0] if row else 0,
                "total_amount": float(row[1]) if row and row[1] else 0.0,
                "approved_amount": float(row[2]) if row and row[2] else 0.0,
                "pending_amount": float(row[3]) if row and row[3] else 0.0,
                "period": "Last 30 days"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "summary": {
                "total_expenses": 0,
                "total_amount": 0.0,
                "approved_amount": 0.0,
                "pending_amount": 0.0,
                "period": "Error"
            }
        }

@router.post("", summary="Create expense")
async def create_expense(
    expense_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new expense"""
    try:
        # Extract data from request
        cheque_id = expense_data.get("cheque_id")
        category_id = expense_data.get("category_id")
        amount = float(expense_data.get("amount", 0))
        description = expense_data.get("description", "")
        paid_to = expense_data.get("paid_to", "")
        notes = expense_data.get("notes", "")
        
        # Validate required fields
        if not cheque_id:
            raise HTTPException(status_code=400, detail="Cheque ID is required")
        if not amount or amount <= 0:
            raise HTTPException(status_code=400, detail="Valid amount is required")
        
        # Always set expense_date to current server date (cannot be changed by user)
        expense_date = datetime.now().date()
        
        # Get cheque details including safe_id, amount, and current expenses
        cheque_result = db.execute(text("""
            SELECT c.safe_id, c.amount, c.cheque_number,
                   COALESCE(
                       (SELECT SUM(e.amount) FROM expenses e WHERE e.cheque_id = c.id AND e.status != 'rejected'),
                       0
                   ) as current_expenses
            FROM cheques c
            WHERE c.id = :cheque_id
        """), {"cheque_id": cheque_id})
        cheque_row = cheque_result.fetchone()
        if not cheque_row:
            raise HTTPException(status_code=404, detail="Cheque not found")
        
        safe_id = cheque_row[0]
        cheque_amount = float(cheque_row[1]) if cheque_row[1] else 0.0
        cheque_number = cheque_row[2]
        current_expenses = float(cheque_row[3]) if cheque_row[3] else 0.0
        
        # Get safe details
        if safe_id:
            safe_result = db.execute(text("SELECT name, current_balance FROM safes WHERE id = :safe_id"), 
                                   {"safe_id": safe_id})
            safe_row = safe_result.fetchone()
            if not safe_row:
                raise HTTPException(status_code=404, detail="Safe not found")
            
            safe_name = safe_row[0]
            safe_balance = float(safe_row[1]) if safe_row[1] else 0.0
        else:
            raise HTTPException(status_code=400, detail="Cheque is not assigned to any safe")
        
        # Calculate overspend amount if any
        new_total_expenses = current_expenses + amount
        overspend_amount = max(0, new_total_expenses - cheque_amount)
        
        # Validate safe balance constraints
        if overspend_amount > 0:
            if overspend_amount > safe_balance:
                # Calculate maximum allowed expense
                max_allowed_expense = amount - (overspend_amount - safe_balance)
                
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot create expense: This would overspend cheque #{cheque_number} by ${overspend_amount:.2f}, "
                           f"but safe '{safe_name}' only has ${safe_balance:.2f} available. "
                           f"Maximum allowed expense amount: ${max_allowed_expense:.2f}. "
                           f"Current cheque details: Amount=${cheque_amount:.2f}, "
                           f"Already spent=${current_expenses:.2f}, Remaining=${cheque_amount - current_expenses:.2f}"
                )
        
        # Insert expense
        insert_result = db.execute(text("""
            INSERT INTO expenses (cheque_id, category_id, safe_id, amount, description, paid_to, expense_date, notes, status, created_at)
            VALUES (:cheque_id, :category_id, :safe_id, :amount, :description, :paid_to, :expense_date, :notes, 'pending', NOW())
        """), {
            "cheque_id": cheque_id,
            "category_id": category_id if category_id else None,
            "safe_id": safe_id,
            "amount": amount,
            "description": description,
            "paid_to": paid_to,
            "expense_date": expense_date,
            "notes": notes
        })
        
        # Update safe balance - deduct the expense amount
        if safe_id:
            db.execute(text("""
                UPDATE safes 
                SET current_balance = current_balance - :amount
                WHERE id = :safe_id
            """), {
                "amount": amount,
                "safe_id": safe_id
            })
        
        db.commit()
        
        # Get the created expense ID
        expense_id = insert_result.lastrowid
        
        return {
            "success": True,
            "message": "Expense created successfully",
            "expense_id": expense_id,
            "data": {
                "id": expense_id,
                "cheque_id": cheque_id,
                "category_id": category_id,
                "safe_id": safe_id,
                "amount": amount,
                "description": description,
                "paid_to": paid_to,
                "expense_date": expense_date.isoformat() if expense_date else None,
                "notes": notes,
                "status": "pending"
            }
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create expense: {str(e)}")

@router.get("/cheques", summary="Get all cheques for expense filtering")
async def get_cheques_for_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all cheques with their expense counts for filtering"""
    try:
        result = db.execute(text("""
            SELECT c.id, c.cheque_number, c.amount, c.description, c.issue_date,
                   s.name as safe_name, COUNT(e.id) as expense_count,
                   COALESCE(SUM(e.amount), 0) as total_expenses
            FROM cheques c
            LEFT JOIN safes s ON c.safe_id = s.id
            LEFT JOIN expenses e ON c.id = e.cheque_id
            GROUP BY c.id, c.cheque_number, c.amount, c.description, c.issue_date, s.name
            ORDER BY c.issue_date DESC, c.id DESC
        """))
        
        cheques = []
        for row in result:
            cheques.append({
                "id": row[0],
                "cheque_number": row[1] or "",
                "amount": float(row[2]) if row[2] else 0.0,
                "description": row[3] or "",
                "issue_date": row[4].isoformat() if row[4] else None,
                "safe_name": row[5] or "Unknown Safe",
                "expense_count": row[6] or 0,
                "total_expenses": float(row[7]) if row[7] else 0.0
            })
        
        return {
            "success": True,
            "count": len(cheques),
            "data": cheques
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

