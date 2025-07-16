from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List, Optional
import models
import schemas
from database import get_db
from auth import get_current_active_user, get_password_hash

router = APIRouter(prefix="/admin-simple", tags=["Super Admin"])

@router.post("/reset-safe/{safe_id}")
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

@router.post("/reset-all-safes")
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

@router.delete("/delete-all-cheques")
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

@router.delete("/reset-all-purchase-orders")
async def reset_all_purchase_orders_simple(confirm: str = None, db: Session = Depends(get_db)):
    """Reset ALL purchase orders - sets all to Pending status and deletes all items"""
    try:
        if confirm != "true":
            return {
                "success": False,
                "message": "Confirmation required. Add ?confirm=true to proceed",
                "warning": "This will RESET ALL purchase orders to Pending status and delete all items!"
            }
        
        # Count records before reset
        po_count = db.execute(text("SELECT COUNT(*) FROM purchase_orders")).fetchone()[0]
        item_count = db.execute(text("SELECT COUNT(*) FROM purchase_order_items")).fetchone()[0]
        
        # Delete all purchase order items first (foreign key constraints)
        db.execute(text("DELETE FROM purchase_order_items"))
        
        # Reset all purchase orders to Pending status
        db.execute(text("""
            UPDATE purchase_orders 
            SET status = 'Pending',
                total_amount = 0.00,
                approved_by = NULL,
                approved_at = NULL,
                received_date = NULL,
                received_by = NULL,
                payment_status = 'unpaid',
                payment_date = NULL,
                paid_by = NULL,
                payment_cheque_id = NULL,
                updated_at = NOW()
        """))
        
        db.commit()
        
        return {
            "success": True,
            "message": "ALL PURCHASE ORDERS RESET SUCCESSFULLY",
            "reset_counts": {
                "purchase_orders": po_count,
                "items_deleted": item_count
            },
            "warning": "All purchase orders have been reset to Pending status!"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting purchase orders: {str(e)}")

# Authenticated versions for extra security
@router.post("/reset-safe-auth/{safe_id}")
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

@router.post("/reset-all-safes-auth")
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

@router.delete("/reset-all-purchase-orders-auth")
async def reset_all_purchase_orders_authenticated(
    confirm: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Reset ALL purchase orders - authenticated version"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    # Call the simple version
    return await reset_all_purchase_orders_simple(confirm, db)

@router.delete("/delete-all-cheques-auth")
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
        return [{"id": role.id, "name": role.name, "description": role.description} for role in roles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching roles: {str(e)}")

@router.post("/user-roles")
async def create_user_role(
    role_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new user role"""
    try:
        # Check if role name already exists
        existing_role = db.query(models.UserRole).filter(models.UserRole.name == role_data.get('name')).first()
        if existing_role:
            raise HTTPException(status_code=400, detail="Role name already exists")
        
        # Create new role
        new_role = models.UserRole(
            name=role_data.get('name'),
            description=role_data.get('description', '')
        )
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        
        return {
            "id": new_role.id,
            "name": new_role.name,
            "description": new_role.description,
            "message": "Role created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating role: {str(e)}")

@router.put("/user-roles/{role_id}")
async def update_user_role(
    role_id: int,
    role_data: dict,
    db: Session = Depends(get_db)
):
    """Update an existing user role"""
    try:
        # Check if role exists
        role = db.query(models.UserRole).filter(models.UserRole.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Check if new name conflicts with existing role (if name is being changed)
        if role_data.get('name') and role_data.get('name') != role.name:
            existing_role = db.query(models.UserRole).filter(
                models.UserRole.name == role_data.get('name'),
                models.UserRole.id != role_id
            ).first()
            if existing_role:
                raise HTTPException(status_code=400, detail="Role name already exists")
        
        # Update role
        if role_data.get('name'):
            role.name = role_data.get('name')
        if 'description' in role_data:
            role.description = role_data.get('description', '')
        
        db.commit()
        db.refresh(role)
        
        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "message": "Role updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating role: {str(e)}")

@router.delete("/user-roles/{role_id}")
async def delete_user_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    """Delete a user role (only if no users are assigned to it)"""
    try:
        # Check if role exists
        role = db.query(models.UserRole).filter(models.UserRole.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Check if any users are assigned to this role
        users_with_role = db.query(models.User).filter(models.User.role_id == role_id).count()
        if users_with_role > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete role '{role.name}' - {users_with_role} user(s) are assigned to it"
            )
        
        # Delete role
        db.delete(role)
        db.commit()
        
        return {
            "message": f"Role '{role.name}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting role: {str(e)}")

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
    request: schemas.RolePermissionsRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save permissions for a specific role - Super Admin only"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Find the role
        role = db.query(models.UserRole).filter(models.UserRole.name == role_name).first()
        if not role:
            raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found")
        
        # Delete existing permissions for this role
        db.query(models.Permission).filter(models.Permission.role_id == role.id).delete()
        
        # Add new permissions
        for permission_key in request.permissions:
            # Get default info from role_permissions_defaults if available
            default_info = db.query(models.RolePermissionDefault).filter(
                models.RolePermissionDefault.role_name == role_name,
                models.RolePermissionDefault.permission_key == permission_key
            ).first()
            
            permission = models.Permission(
                role_id=role.id,
                feature_key=permission_key,
                permission_name=default_info.permission_name if default_info else permission_key.replace('_', ' ').title(),
                description=default_info.description if default_info else f"Permission to {permission_key.replace('_', ' ')}",
                category=default_info.category if default_info else "General"
            )
            db.add(permission)
        
        db.commit()
        
        return {
            "message": f"Permissions saved for role: {role_name}", 
            "permissions_count": len(request.permissions),
            "role_id": role.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
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
        # Find the role
        role = db.query(models.UserRole).filter(models.UserRole.name == role_name).first()
        if not role:
            raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found")
        
        # Get permissions for this role
        permissions = db.query(models.Permission).filter(models.Permission.role_id == role.id).all()
        permission_keys = [p.feature_key for p in permissions]
        
        return permission_keys
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading permissions: {str(e)}")

@router.get("/permissions/all-roles", response_model=schemas.AllRolePermissionsResponse)
async def get_all_role_permissions(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get permissions for all roles"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Get all roles with their permissions
        roles = db.query(models.UserRole).options(joinedload(models.UserRole.permissions)).all()
        
        role_permissions = {}
        for role in roles:
            permission_keys = [p.feature_key for p in role.permissions]
            role_permissions[role.name] = permission_keys
        
        return {
            "roles": role_permissions,
            "total_roles": len(roles)
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading all permissions: {str(e)}")

@router.post("/permissions/reset-to-defaults")
async def reset_permissions_to_defaults(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reset all permissions to defaults from role_permissions_defaults table"""
    if current_user.role_id != 1:  # Only Admin role can access
        raise HTTPException(status_code=403, detail="Access denied. Super Admin required.")
    
    try:
        # Clear all existing permissions
        db.query(models.Permission).delete()
        
        # Load defaults and apply them
        defaults = db.query(models.RolePermissionDefault).all()
        
        for default in defaults:
            role = db.query(models.UserRole).filter(models.UserRole.name == default.role_name).first()
            if role:
                permission = models.Permission(
                    role_id=role.id,
                    feature_key=default.permission_key,
                    permission_name=default.permission_name,
                    description=default.description,
                    category=default.category
                )
                db.add(permission)
        
        db.commit()
        
        # Count what was created
        total_permissions = db.query(models.Permission).count()
        
        return {
            "message": "Permissions reset to defaults successfully",
            "total_permissions_created": total_permissions
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting permissions: {str(e)}")

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