from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List, Optional
import models
import schemas
from database import get_db
from auth import get_current_active_user, get_password_hash

router = APIRouter(prefix="/admin-simple", tags=["Super Admin"])

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
    current_user: models.User = Depends(get_current_active_user)
):
    """Reset a specific safe - authenticated version"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    # Call the simple version
    return await reset_safe_simple(safe_id, db)

@router.post("/admin/reset-all-safes")
async def reset_all_safes_authenticated(
    confirm: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Reset ALL safes - authenticated version"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    # Call the simple version
    return await reset_all_safes_simple(confirm, db)

@router.delete("/admin/delete-all-cheques")
async def delete_all_cheques_authenticated(
    confirm: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete ALL cheques - authenticated version"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    # Call the simple version
    return await delete_all_cheques_simple(confirm, db) 

# User Management Endpoints
@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users with their roles - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        users = db.query(models.User).options(
            joinedload(models.User.role)
        ).order_by(models.User.created_at.desc()).all()
        
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@router.get("/user-roles", response_model=List[schemas.UserRoleResponse])
async def get_user_roles(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available user roles"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        roles = db.query(models.UserRole).order_by(models.UserRole.id).all()
        return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching roles: {str(e)}")

@router.get("/user-roles-simple")
async def get_user_roles_simple(db: Session = Depends(get_db)):
    """Get all available user roles - Simple version for frontend"""
    try:
        roles = db.query(models.UserRole).order_by(models.UserRole.id).all()
        return [{"id": role.id, "name": role.name} for role in roles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching roles: {str(e)}")

@router.post("/users", response_model=schemas.UserResponse)
async def create_user(
    user_data: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new user - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Check if username already exists
        existing_user = db.query(models.User).filter(
            models.User.username == user_data.username
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Validate role exists
        role = db.query(models.UserRole).filter(models.UserRole.id == user_data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role ID")
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create new user
        new_user = models.User(
            username=user_data.username,
            password_hash=hashed_password,
            role_id=user_data.role_id,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Load user with role for response
        user_with_role = db.query(models.User).options(
            joinedload(models.User.role)
        ).filter(models.User.id == new_user.id).first()
        
        return user_with_role
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user information including language preference"""
    # Allow users to update their own language preference or admin to update any user
    if current_user.id != user_id and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile.")
    
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields that are provided
        if user_data.username is not None:
            # Check if username is already taken by another user
            existing_user = db.query(models.User).filter(
                models.User.username == user_data.username,
                models.User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already exists")
            user.username = user_data.username
            
        if user_data.password is not None:
            from auth import get_password_hash
            user.password_hash = get_password_hash(user_data.password)
            
        if user_data.role_id is not None:
            # Only admin can change roles
            if current_user.role_id != 1:
                raise HTTPException(status_code=403, detail="Only administrators can change user roles")
            user.role_id = user_data.role_id
            
        if user_data.is_active is not None:
            # Only admin can change active status
            if current_user.role_id != 1:
                raise HTTPException(status_code=403, detail="Only administrators can change user status")
            user.is_active = user_data.is_active
            
        if user_data.preferred_language is not None:
            # Anyone can update their own language preference
            if user_data.preferred_language in ['en', 'ar']:
                user.preferred_language = user_data.preferred_language
            else:
                raise HTTPException(status_code=400, detail="Invalid language. Supported languages: en, ar")
        
        db.commit()
        db.refresh(user)
        
        # Load user with role for response
        user_with_role = db.query(models.User).options(
            joinedload(models.User.role)
        ).filter(models.User.id == user.id).first()
        
        return user_with_role
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.post("/roles/{role_name}/permissions")
async def save_role_permissions(
    role_name: str,
    permissions: List[str],
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save permissions for a specific role - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # For now, we'll store role permissions in a simple JSON file
        # In a production system, you might want a dedicated permissions table
        import json
        import os
        
        permissions_file = "role_permissions.json"
        
        # Load existing permissions or create empty dict
        if os.path.exists(permissions_file):
            with open(permissions_file, 'r') as f:
                role_permissions = json.load(f)
        else:
            role_permissions = {}
        
        # Update permissions for the role
        role_permissions[role_name] = permissions
        
        # Save back to file
        with open(permissions_file, 'w') as f:
            json.dump(role_permissions, f, indent=2)
        
        return {"message": f"Permissions saved for role: {role_name}", "permissions_count": len(permissions)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving permissions: {str(e)}")

@router.get("/roles/{role_name}/permissions")
async def get_role_permissions(
    role_name: str,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get permissions for a specific role"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        import json
        import os
        
        permissions_file = "role_permissions.json"
        
        if os.path.exists(permissions_file):
            with open(permissions_file, 'r') as f:
                role_permissions = json.load(f)
            return role_permissions.get(role_name, [])
        else:
            # Return default permissions for the role
            return []
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading permissions: {str(e)}")

@router.put("/users/{user_id}/admin", response_model=schemas.UserResponse)
async def admin_update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user information - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Get the user to update
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Don't allow updating your own account through this endpoint
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot update your own account through this endpoint")
        
        # Check if new username already exists (if username is being changed)
        if user_data.username and user_data.username != user.username:
            existing_user = db.query(models.User).filter(
                models.User.username == user_data.username,
                models.User.id != user_id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already exists")
        
        # Update fields
        if user_data.username:
            user.username = user_data.username
        if user_data.role_id:
            # Validate role exists
            role = db.query(models.UserRole).filter(models.UserRole.id == user_data.role_id).first()
            if not role:
                raise HTTPException(status_code=400, detail="Invalid role ID")
            user.role_id = user_data.role_id
        if user_data.password:
            user.password_hash = get_password_hash(user_data.password)
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        
        db.commit()
        db.refresh(user)
        
        # Load user with role for response
        user_with_role = db.query(models.User).options(
            joinedload(models.User.role)
        ).filter(models.User.id == user.id).first()
        
        return user_with_role
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a user - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Get the user to delete
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Don't allow deleting your own account
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Delete the user
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": f"User '{user.username}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Get the user to toggle
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Don't allow deactivating your own account
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        
        # Toggle active status
        user.is_active = not user.is_active
        db.commit()
        
        status = "activated" if user.is_active else "deactivated"
        return {"success": True, "message": f"User '{user.username}' {status} successfully", "is_active": user.is_active}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error toggling user status: {str(e)}") 