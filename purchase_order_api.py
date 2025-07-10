#!/usr/bin/env python3
"""
Purchase Order API endpoints for FastAPI + React migration
Preserves all logic and integrates with existing Arabic cheque system
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, and_, or_, desc
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
import json

from database import get_db
from auth import get_current_active_user
import models
import schemas
from db import get_connection, get_ingredient_packages, get_supplier_default_price, calculate_package_totals
from arabic_cheque_generator import generate_arabic_cheque
from html_purchase_order import generate_purchase_order_html

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase-orders"])

# ==========================================
# SUPPLIER ENDPOINTS
# ==========================================

@router.get("/suppliers", response_model=List[schemas.SupplierWithStats])
async def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    name_contains: Optional[str] = None,
    has_items: Optional[bool] = None,
    has_packages: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get suppliers with statistics"""
    query = db.query(models.Supplier)
    
    # Apply filters
    if name_contains:
        query = query.filter(models.Supplier.name.ilike(f"%{name_contains}%"))
    
    suppliers = query.offset(skip).limit(limit).all()
    
    # Build response with stats
    result = []
    for supplier in suppliers:
        # Get counts without triggering lazy load of full relationships
        po_count = db.query(models.PurchaseOrder).filter(
            models.PurchaseOrder.supplier_id == supplier.id
        ).count()
        
        item_count = db.query(models.SupplierItem).filter(
            models.SupplierItem.supplier_id == supplier.id
        ).count()
        
        package_count = db.query(models.SupplierPackage).filter(
            models.SupplierPackage.supplier_id == supplier.id
        ).count()
        
        supplier_dict = {
            "id": supplier.id,
            "name": supplier.name,
            "contact_name": supplier.contact_name,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
            "notes": supplier.notes,
            "total_purchase_orders": po_count,
            "total_items": item_count,
            "total_packages": package_count
        }
        result.append(supplier_dict)
    
    return result

@router.post("/suppliers", response_model=schemas.Supplier)
async def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new supplier"""
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/suppliers/{supplier_id}", response_model=schemas.SupplierWithStats)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get supplier by ID with statistics"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier_dict = {
        "id": supplier.id,
        "name": supplier.name,
        "contact_name": supplier.contact_name,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "notes": supplier.notes,
        "total_purchase_orders": len(supplier.purchase_orders),
        "total_items": len(supplier.supplier_items),
        "total_packages": 0  # Set to 0 for now since package structure is different
    }
    return supplier_dict

@router.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
async def update_supplier(
    supplier_id: int,
    supplier_update: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update supplier"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for field, value in supplier_update.dict(exclude_unset=True).items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete supplier"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}

# ==========================================
# SUPPLIER PACKAGE ENDPOINTS  
# ==========================================

@router.get("/suppliers/{supplier_id}/packages", response_model=List[schemas.SupplierPackageWithPrice])
async def get_supplier_packages(
    supplier_id: int,
    item_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get packages for a supplier"""
    query = db.query(models.SupplierPackage).options(
        joinedload(models.SupplierPackage.package).joinedload(models.IngredientPackage.ingredient),
        joinedload(models.SupplierPackage.supplier)
    ).filter(models.SupplierPackage.supplier_id == supplier_id)
    
    if item_id:
        # Filter by item_id through the package relationship
        query = query.join(models.IngredientPackage).filter(models.IngredientPackage.ingredient_id == item_id)
    
    packages = query.all()
    
    # Add price per kg calculation
    result = []
    for package in packages:
        package_dict = {
            "id": package.id,
            "item_id": package.item_id,  # Uses the property that goes through package relationship
            "supplier_id": package.supplier_id,
            "package_size_kg": package.package_size_kg,  # Uses the property
            "price_per_package": package.price_per_package,  # Uses the property
            "last_updated": package.updated_at.date() if package.updated_at else None,
            "created_at": package.created_at,
            "updated_at": package.updated_at,
            "item": package.item,  # Uses the property
            "supplier": package.supplier,
            "price_per_kg": package.price_per_kg  # Uses the property
        }
        result.append(package_dict)
    
    return result

@router.post("/suppliers/{supplier_id}/packages", response_model=schemas.SupplierPackage)
async def create_supplier_package(
    supplier_id: int,
    package: schemas.SupplierPackageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new supplier package"""
    # Verify supplier exists
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Note: For now, this endpoint is disabled since the schema requires package_id 
    # which references ingredient_packages table, not direct item_id
    raise HTTPException(
        status_code=501, 
        detail="Supplier package creation not implemented - requires package_id from ingredient_packages table"
    )

# ==========================================
# PURCHASE ORDER ENDPOINTS
# ==========================================

@router.get("/", response_model=List[schemas.PurchaseOrderWithDetails])
async def get_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    order_date_from: Optional[date] = None,
    order_date_to: Optional[date] = None,
    payment_date_from: Optional[date] = None,
    payment_date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get purchase orders with filters"""
    query = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.warehouse),
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    )
    
    # Apply filters
    if supplier_id:
        query = query.filter(models.PurchaseOrder.supplier_id == supplier_id)
    if warehouse_id:
        query = query.filter(models.PurchaseOrder.warehouse_id == warehouse_id)
    if status:
        query = query.filter(models.PurchaseOrder.status == status)
    if payment_status:
        if payment_status == 'unpaid':
            # Include records where payment_status is NULL or 'unpaid'
            query = query.filter(
                or_(
                    models.PurchaseOrder.payment_status == None,
                    models.PurchaseOrder.payment_status == 'unpaid'
                )
            )
        else:
            query = query.filter(models.PurchaseOrder.payment_status == payment_status)
    if order_date_from:
        query = query.filter(models.PurchaseOrder.order_date >= order_date_from)
    if order_date_to:
        query = query.filter(models.PurchaseOrder.order_date <= order_date_to)
    if payment_date_from:
        query = query.filter(models.PurchaseOrder.payment_date >= payment_date_from)
    if payment_date_to:
        # Add 23:59:59 to include the entire day
        payment_date_to_end = datetime.combine(payment_date_to, datetime.max.time())
        query = query.filter(models.PurchaseOrder.payment_date <= payment_date_to_end)
    
    # Order by most recent
    query = query.order_by(desc(models.PurchaseOrder.created_at))
    
    purchase_orders = query.offset(skip).limit(limit).all()
    
    # Add calculated fields
    result = []
    for po in purchase_orders:
        # Map DB status to frontend status nomenclature
        status_map = {
            "Pending": "draft",
            "Received": "received",
            "Cancelled": "cancelled"
        }

        po_dict = {
            "id": po.id,
            "supplier_id": po.supplier_id,
            "order_date": po.order_date,
            "expected_date": po.expected_date,
            "status": status_map.get(po.status, po.status.lower() if isinstance(po.status, str) else "draft"),
            "total_amount": po.total_amount,
            "created_at": po.created_at,
            "updated_at": po.updated_at,
            "supplier": po.supplier,
            "supplier_name": po.supplier.name if po.supplier else "Unknown",
            "priority": getattr(po, "priority", "medium"),
            "warehouse_id": po.warehouse_id,
            "warehouse": po.warehouse,
            "items": po.items,
            "calculated_total": po.calculated_total,
            "item_count": len(po.items)
        }
        result.append(po_dict)
    
    return result

@router.post("/", response_model=schemas.PurchaseOrderWithDetails)
async def create_purchase_order(
    po_request: schemas.PurchaseOrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new purchase order"""
    try:
        # Verify supplier exists
        supplier = db.query(models.Supplier).filter(models.Supplier.id == po_request.supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Create purchase order
        po_data = po_request.dict(exclude={"items"})
        db_po = models.PurchaseOrder(**po_data)
        db.add(db_po)
        db.flush()  # Get the ID but don't commit yet
        
        # Create items
        total_amount = Decimal('0.00')
        for item_data in po_request.items:
            # Verify item exists
            item = db.query(models.Item).filter(models.Item.id == item_data.item_id).first()
            if not item:
                raise HTTPException(status_code=404, detail=f"Item with ID {item_data.item_id} not found")
            
            # Create purchase order item
            po_item = models.PurchaseOrderItem(
                purchase_order_id=db_po.id,
                item_id=item_data.item_id,
                quantity_ordered=item_data.quantity_ordered,
                unit_price=item_data.unit_price,
                total_price=item_data.quantity_ordered * item_data.unit_price
            )
            db.add(po_item)
            total_amount += po_item.total_price
        
        # Update total amount
        db_po.total_amount = total_amount
        
        db.commit()
        db.refresh(db_po)
        
        # Load with relationships for response
        po_with_details = db.query(models.PurchaseOrder).options(
            joinedload(models.PurchaseOrder.supplier),
            joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
        ).filter(models.PurchaseOrder.id == db_po.id).first()
        
        # Map DB status to frontend status nomenclature
        status_map = {
            "Pending": "draft",
            "Received": "received",
            "Cancelled": "cancelled"
        }

        return {
            "id": po_with_details.id,
            "supplier_id": po_with_details.supplier_id,
            "order_date": po_with_details.order_date,
            "expected_date": po_with_details.expected_date,
            "status": status_map.get(po_with_details.status, po_with_details.status.lower() if isinstance(po_with_details.status, str) else "draft"),
            "total_amount": po_with_details.total_amount,
            "created_at": po_with_details.created_at,
            "updated_at": po_with_details.updated_at,
            "supplier": po_with_details.supplier,
            "supplier_name": po_with_details.supplier.name if po_with_details.supplier else "Unknown",
            "priority": getattr(po_with_details, "priority", "medium"),
            "warehouse_id": po_with_details.warehouse_id,
            "warehouse": po_with_details.warehouse,
            "items": po_with_details.items,
            "calculated_total": po_with_details.calculated_total,
            "item_count": len(po_with_details.items)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating purchase order: {str(e)}")

@router.get("/{po_id}", response_model=schemas.PurchaseOrderWithDetails)
async def get_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get purchase order by ID"""
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    ).filter(models.PurchaseOrder.id == po_id).first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Map DB status to frontend status nomenclature
    status_map = {
        "Pending": "draft",
        "Received": "received",
        "Cancelled": "cancelled"
    }

    return {
        "id": po.id,
        "supplier_id": po.supplier_id,
        "order_date": po.order_date,
        "expected_date": po.expected_date,
        "status": status_map.get(po.status, po.status.lower() if isinstance(po.status, str) else "draft"),
        "total_amount": po.total_amount,
        "created_at": po.created_at,
        "updated_at": po.updated_at,
        "supplier": po.supplier,
        "supplier_name": po.supplier.name if po.supplier else "Unknown",
        "priority": getattr(po, "priority", "medium"),
        "warehouse_id": po.warehouse_id,
        "warehouse": po.warehouse,
        "items": po.items,
        "calculated_total": po.calculated_total,
        "item_count": len(po.items)
    }

@router.put("/{po_id}", response_model=schemas.PurchaseOrderWithDetails)
async def update_purchase_order(
    po_id: int,
    po_update: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update purchase order"""
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Update fields
    for field, value in po_update.dict(exclude_unset=True).items():
        setattr(po, field, value)
    
    db.commit()
    db.refresh(po)
    
    # Return with details
    return await get_purchase_order(po_id, db, current_user)

@router.post("/{po_id}/items", response_model=schemas.PurchaseOrderItem)
async def add_purchase_order_item(
    po_id: int,
    item: schemas.PurchaseOrderItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add item to purchase order"""
    # Verify PO exists
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Verify item exists
    item_obj = db.query(models.Item).filter(models.Item.id == item.item_id).first()
    if not item_obj:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Create PO item
    po_item = models.PurchaseOrderItem(
        purchase_order_id=po_id,
        item_id=item.item_id,
        quantity_ordered=item.quantity_ordered,
        unit_price=item.unit_price,
        total_price=item.quantity_ordered * item.unit_price
    )
    
    db.add(po_item)
    
    # Update PO total
    po.update_total()
    
    db.commit()
    db.refresh(po_item)
    
    return po_item

@router.put("/{po_id}/items/{item_id}", response_model=schemas.PurchaseOrderItem)
async def update_purchase_order_item(
    po_id: int,
    item_id: int,
    item_update: schemas.PurchaseOrderItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update purchase order item"""
    po_item = db.query(models.PurchaseOrderItem).filter(
        models.PurchaseOrderItem.purchase_order_id == po_id,
        models.PurchaseOrderItem.id == item_id
    ).first()
    
    if not po_item:
        raise HTTPException(status_code=404, detail="Purchase order item not found")
    
    # Update fields
    for field, value in item_update.dict(exclude_unset=True).items():
        setattr(po_item, field, value)
    
    # Recalculate total
    po_item.calculate_total()
    
    # Update PO total
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    po.update_total()
    
    db.commit()
    db.refresh(po_item)
    
    return po_item

@router.delete("/{po_id}/items/{item_id}")
async def delete_purchase_order_item(
    po_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete purchase order item"""
    po_item = db.query(models.PurchaseOrderItem).filter(
        models.PurchaseOrderItem.purchase_order_id == po_id,
        models.PurchaseOrderItem.id == item_id
    ).first()
    
    if not po_item:
        raise HTTPException(status_code=404, detail="Purchase order item not found")
    
    db.delete(po_item)
    
    # Update PO total
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()
    if po:
        po.update_total()
    
    db.commit()
    
    return {"message": "Item deleted successfully"}

# ==========================================
# UTILITY ENDPOINTS
# ==========================================

@router.get("/items/search")
async def search_items(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Search items for purchase orders"""
    items = db.query(models.Item).filter(
        models.Item.name.ilike(f"%{q}%")
    ).limit(limit).all()
    
    return [{
        "id": item.id, 
        "name": item.name, 
        "unit": item.unit,
        "price_per_unit": float(item.price_per_unit) if item.price_per_unit else 0.0
    } for item in items]

@router.get("/suppliers/{supplier_id}/items")
async def get_supplier_items(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get items available from a supplier"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get supplier items with packages
        query = """
            SELECT 
                i.id, i.name, i.unit,
                si.supplier_price,
                COUNT(sp.id) as package_count
            FROM items i
            LEFT JOIN supplier_items si ON i.id = si.item_id AND si.supplier_id = %s
            LEFT JOIN supplier_packages sp ON i.id = sp.item_id AND sp.supplier_id = %s
            WHERE si.supplier_id = %s OR sp.supplier_id = %s
            GROUP BY i.id, i.name, i.unit, si.supplier_price
            ORDER BY i.name
        """
        
        cursor.execute(query, (supplier_id, supplier_id, supplier_id, supplier_id))
        items = cursor.fetchall()
        
        return items
        
    finally:
        cursor.close()
        conn.close()

@router.get("/package-suggestions/{item_id}")
async def get_package_suggestions(
    item_id: int,
    supplier_id: Optional[int] = None,
    quantity_needed: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get package suggestions for an item"""
    packages = get_ingredient_packages(item_id, supplier_id)
    
    # Add price per kg and recommendations
    for package in packages:
        if package['package_size_kg'] and package['package_size_kg'] > 0:
            package['price_per_kg'] = float(package['price_per_package']) / float(package['package_size_kg'])
        else:
            package['price_per_kg'] = 0.0
    
    # Sort by price per kg (cheapest first)
    packages.sort(key=lambda x: x['price_per_kg'])
    
    return {
        "item_id": item_id,
        "packages": packages,
        "recommended_package_id": packages[0]['id'] if packages else None,
        "total_needed_kg": quantity_needed or 0
    }

# ==========================================
# CHEQUE INTEGRATION
# ==========================================

@router.post("/{po_id}/generate-cheque", response_model=schemas.PurchaseOrderChequeResponse)
async def generate_purchase_order_cheque(
    po_id: int,
    cheque_request: schemas.PurchaseOrderChequeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Generate and print Arabic cheque for finalized purchase order"""
    try:
        # Get purchase order with supplier details
        po = db.query(models.PurchaseOrder).options(
            joinedload(models.PurchaseOrder.supplier),
            joinedload(models.PurchaseOrder.items)
        ).filter(models.PurchaseOrder.id == po_id).first()
        
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        if po.status not in ["Pending", "Received"]:
            raise HTTPException(status_code=400, detail="Purchase order must be pending or received to generate cheque")
        
        # Determine the amount to use
        cheque_amount = cheque_request.amount if cheque_request.amount is not None else po.total_amount
        
        # Check if using existing cheque or creating new one
        if cheque_request.existing_cheque_id:
            # Use existing cheque
            cheque = db.query(models.Cheque).filter(
                models.Cheque.id == cheque_request.existing_cheque_id
            ).first()
            
            if not cheque:
                raise HTTPException(status_code=404, detail="Cheque not found")
            
            if cheque.is_assigned_to_safe:
                raise HTTPException(status_code=400, detail="Cheque is already assigned to a safe")
            
            if cheque.is_settled:
                raise HTTPException(status_code=400, detail="Cheque is already settled")
            
            # Update cheque details
            cheque.amount = cheque_amount
            cheque.safe_id = cheque_request.safe_id
            cheque.is_assigned_to_safe = True
            cheque.assigned_by = current_user.id
            cheque.status = "settled_pending_invoice"  # Set correct status for supplier payments
            cheque.issued_to = po.supplier.name
            cheque.description = cheque_request.description or f"Payment for Purchase Order #{po.id} - {po.supplier.name}"
            # Mark as supplier payment
            cheque.is_supplier_payment = True
            cheque.supplier_invoice_uploaded = False
            
            bank_account = cheque.bank_account
            
        else:
            # Create new cheque
            if not cheque_request.bank_account_id:
                raise HTTPException(status_code=400, detail="Bank account ID is required for new cheque")
            
            # Get bank account
            bank_account = db.query(models.BankAccount).filter(
                models.BankAccount.id == cheque_request.bank_account_id
            ).first()
            
            if not bank_account:
                raise HTTPException(status_code=404, detail="Bank account not found")
            
            # Generate cheque number if not provided
            cheque_number = cheque_request.cheque_number
            if not cheque_number:
                # Generate auto cheque number
                last_cheque = db.query(models.Cheque).filter(
                    models.Cheque.bank_account_id == cheque_request.bank_account_id
                ).order_by(desc(models.Cheque.id)).first()
                
                if last_cheque and last_cheque.cheque_number.isdigit():
                    cheque_number = str(int(last_cheque.cheque_number) + 1).zfill(6)
                else:
                    cheque_number = "100001"  # Default starting number
            
            # Create cheque
            description = cheque_request.description or f"Payment for Purchase Order #{po.id} - {po.supplier.name}"
            
            cheque = models.Cheque(
                cheque_number=cheque_number,
                bank_account_id=cheque_request.bank_account_id,
                safe_id=cheque_request.safe_id,
                amount=cheque_amount,
                issue_date=datetime.now(),
                description=description,
                status="settled_pending_invoice",  # Set correct status for supplier payments
                created_by=current_user.id,
                issued_to=po.supplier.name,  # Store supplier name
                is_supplier_payment=True,
                supplier_invoice_uploaded=False
            )
            
            if cheque_request.safe_id:
                cheque.is_assigned_to_safe = True
                cheque.assigned_by = current_user.id
                # Keep status as settled_pending_invoice
            
            db.add(cheque)
            db.flush()  # Get the cheque ID
        
        # Create expense record for the purchase order payment
        # Find or create a supplier payments category
        supplier_category = db.query(models.ExpenseCategory).filter(
            models.ExpenseCategory.name == "مدفوعات الموردين"
        ).first()
        
        if not supplier_category:
            # Create the category if it doesn't exist
            supplier_category = models.ExpenseCategory(
                name="مدفوعات الموردين",
                description="Supplier Payments",
                level=0,
                path="مدفوعات الموردين",
                icon="fas fa-truck",
                color="#4CAF50"
            )
            db.add(supplier_category)
            db.flush()
        
        # Create expense record
        expense = models.Expense(
            cheque_id=cheque.id,
            category_id=supplier_category.id,
            amount=cheque_amount,
            description=f"دفعة لأمر الشراء #{po.id} - {po.supplier.name}",
            expense_date=datetime.now(),
            created_by=current_user.id,
            status="approved",  # Auto-approve supplier payments
            approved_by=current_user.id,
            notes=f"Purchase Order: {po.id}, Supplier: {po.supplier.name}, Items: {len(po.items)}"
        )
        db.add(expense)
        
        # Update cheque total expenses
        cheque.total_expenses = cheque_amount
        cheque.update_status()
        
        # Update purchase order payment status
        po.payment_status = "paid"
        po.payment_date = datetime.now()
        po.paid_by = current_user.id
        po.payment_cheque_id = cheque.id
        
        db.commit()
        db.refresh(cheque)
        
        # Generate Arabic PDF with enhanced data
        try:
            cheque_data = {
                "cheque_number": cheque.cheque_number,
                "amount_number": float(cheque.amount),
                "beneficiary_name": cheque.issued_to or "Unknown",  # This is what the UI expects
                "issued_to": cheque.issued_to or "Unknown",  # This is what the company table expects
                "issue_date": (cheque.issue_date or datetime.now()).strftime("%Y-%m-%d"),
                "due_date": (cheque.due_date or datetime.now()).strftime("%Y-%m-%d") if cheque.due_date else None,  # Added due_date field
                "expense_description": cheque.description or expense.description,
                "date": (cheque.issue_date or datetime.now()).strftime("%Y-%m-%d"),
                "safe_name": cheque.safe.name if cheque.safe else "No Safe",
                "bank_name": bank_account.bank_name,
                "payee_notice": "يصرف للمستفيد الأول",
                
                # Enhanced fields
                "server_date": cheque.created_at.strftime("%Y-%m-%d"),
                "expense_number": f"PO-{po_id}",
                "reference_number": f"REF-PO-{po_id}-{cheque.created_at.strftime('%Y%m%d')}",
                "account_code": f"SUP-{cheque.issued_to[:3].upper()}" if cheque.issued_to else "SUP-UNK",
                "department": "قسم المشتريات",
                "category_path": supplier_category.full_path if supplier_category else "مدفوعات الموردين",
                
                # Additional metadata
                "cheque_status": cheque.status,
                "expense_date": expense.expense_date.strftime("%Y-%m-%d") if expense else cheque.issue_date.strftime("%Y-%m-%d"),
                "category_name": supplier_category.name if supplier_category else "مدفوعات الموردين",
                
                # Enable company table by default for purchase orders
                "field_visibility": {
                    "company_table": True,
                    "company_copy_header": False  # Avoid duplicate headers
                },
                "debug_mode": False
            }
            
            # Import the Arabic cheque generator
            from arabic_cheque_generator import generate_arabic_cheque
            pdf_bytes = generate_arabic_cheque(cheque_data)
            
            return {
                "success": True,
                "cheque_id": cheque.id,
                "cheque_number": cheque.cheque_number,
                "expense_id": expense.id,
                "arabic_pdf_url": f"/api/purchase-orders/{po_id}/cheque/{cheque.id}/arabic-pdf",
                "message": f"Cheque {cheque.cheque_number} generated successfully"
            }
            
        except Exception as pdf_error:
            # Cheque was created but PDF generation failed
            return {
                "success": True,
                "cheque_id": cheque.id,
                "cheque_number": cheque.cheque_number,
                "expense_id": expense.id,
                "arabic_pdf_url": None,
                "message": f"Cheque created but PDF generation failed: {str(pdf_error)}"
            }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating cheque: {str(e)}")

@router.get("/{po_id}/cheque/{cheque_id}/arabic-pdf")
async def get_purchase_order_cheque_pdf(
    po_id: int,
    cheque_id: int,
    token: Optional[str] = Query(None, description="Authentication token for direct access"),
    db: Session = Depends(get_db)
):
    """Get the Arabic PDF for a purchase order cheque"""
    
    # Handle authentication - either via header or token parameter
    current_user = None
    if token:
        # Verify token manually
        try:
            from auth import verify_token
            current_user = verify_token(token, db)
            if not current_user:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        # Try to get user from Authorization header
        try:
            from fastapi import Request
            # This is a simplified approach - in production you'd want proper header parsing
            raise HTTPException(status_code=401, detail="Authentication required - please provide token parameter")
        except Exception:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    # Verify the cheque belongs to this purchase order
    cheque = db.query(models.Cheque).filter(
        models.Cheque.id == cheque_id
    ).first()
    
    if not cheque:
        raise HTTPException(status_code=404, detail="Cheque not found")
    
    # Get the associated expense to verify it's for this PO
    expense = db.query(models.Expense).filter(
        models.Expense.cheque_id == cheque_id,
        models.Expense.notes.like(f"%Purchase Order: {po_id}%")
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Cheque not associated with this purchase order")
    
    # Get bank account
    bank_account = cheque.bank_account
    
    # Get supplier category
    supplier_category = expense.category
    
    # Generate cheque data
    cheque_data = {
        "cheque_number": cheque.cheque_number,
        "amount_number": float(cheque.amount),
        "beneficiary_name": cheque.issued_to or "Unknown",  # This is what the UI expects
        "issued_to": cheque.issued_to or "Unknown",  # This is what the company table expects
        "issue_date": (cheque.issue_date or datetime.now()).strftime("%Y-%m-%d"),
        "due_date": (cheque.due_date or datetime.now()).strftime("%Y-%m-%d") if cheque.due_date else None,  # Added due_date field
        "expense_description": cheque.description or expense.description,
        "date": (cheque.issue_date or datetime.now()).strftime("%Y-%m-%d"),
        "safe_name": cheque.safe.name if cheque.safe else "No Safe",
        "bank_name": bank_account.bank_name,
        "payee_notice": "يصرف للمستفيد الأول",
        
        # Enhanced fields
        "server_date": cheque.created_at.strftime("%Y-%m-%d"),
        "expense_number": f"PO-{po_id}",
        "reference_number": f"REF-PO-{po_id}-{cheque.created_at.strftime('%Y%m%d')}",
        "account_code": f"SUP-{cheque.issued_to[:3].upper()}" if cheque.issued_to else "SUP-UNK",
        "department": "قسم المشتريات",
        "category_path": supplier_category.full_path if supplier_category else "مدفوعات الموردين",
        
        # Additional metadata
        "cheque_status": cheque.status,
        "expense_date": expense.expense_date.strftime("%Y-%m-%d") if expense else cheque.issue_date.strftime("%Y-%m-%d"),
        "category_name": supplier_category.name if supplier_category else "مدفوعات الموردين",
        
        # Enable company table by default for purchase orders
        "field_visibility": {
            "company_table": True,
            "company_copy_header": False  # Avoid duplicate headers
        },
        "debug_mode": False
    }
    
    try:
        # Import the Arabic cheque generator
        from arabic_cheque_generator import generate_arabic_cheque
        pdf_bytes = generate_arabic_cheque(cheque_data)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=cheque_{cheque.cheque_number}_arabic.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/{po_id}/pdf")
async def get_purchase_order_pdf(
    po_id: int,
    token: Optional[str] = Query(None, description="Authentication token for direct access"),
    db: Session = Depends(get_db)
):
    """Generate PDF for a purchase order"""
    
    # Handle authentication
    current_user = None
    if token:
        try:
            from auth import verify_token
            current_user = verify_token(token, db)
            if not current_user:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        raise HTTPException(status_code=401, detail="Authentication required - please provide token parameter")
    
    # Get purchase order with all details
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.warehouse),
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    ).filter(models.PurchaseOrder.id == po_id).first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Prepare data for PDF generation
    po_data = {
        "id": po.id,
        "order_date": po.order_date.isoformat() if po.order_date else "",
        "expected_date": po.expected_date.isoformat() if po.expected_date else None,
        "status": po.status,
        "payment_status": po.payment_status or "unpaid",
        "total_amount": float(po.total_amount),
        "supplier": {
            "name": po.supplier.name,
            "contact_name": po.supplier.contact_name,
            "phone": po.supplier.phone,
            "email": po.supplier.email,
            "address": po.supplier.address
        },
        "warehouse": {
            "name": po.warehouse.name if po.warehouse else "Not specified",
            "location": po.warehouse.location if po.warehouse else ""
        } if po.warehouse else None,
        "items": [
            {
                "item_name": item.item.name,
                "quantity_ordered": float(item.quantity_ordered),
                "unit": item.item.unit or "unit",
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price)
            }
            for item in po.items
        ],
        "company_info": {
            "name": "استوديو كيك KBS",
            "address": "١٢٣ شارع المخبز، القاهرة، مصر",
            "phone": "+٢٠ ١٢٣ ٤٥٦ ٧٨٩",
            "email": "orders@kbscakestudio.com"
        }
    }
    
    try:
        # Import the PDF generator
        from purchase_order_pdf_generator import generate_purchase_order_pdf
        # Generate in Arabic by default
        pdf_bytes = generate_purchase_order_pdf(po_data, language='ar')
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=PO_{po.id}_{po.order_date.strftime('%Y%m%d')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/{po_id}/html")
async def get_purchase_order_html(
    po_id: int,
    language: str = Query("ar", description="Language: 'ar' for Arabic, 'en' for English"),
    token: Optional[str] = Query(None, description="Authentication token for direct access"),
    db: Session = Depends(get_db)
):
    """Generate clean HTML purchase order - much better than PDF for Arabic text!"""
    
    # Handle authentication
    current_user = None
    if token:
        try:
            from auth import verify_token
            current_user = verify_token(token, db)
            if not current_user:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        raise HTTPException(status_code=401, detail="Authentication required - please provide token parameter")
    
    # Get purchase order with all details
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.warehouse),
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    ).filter(models.PurchaseOrder.id == po_id).first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Prepare data for HTML generation
    po_data = {
        "id": po.id,
        "order_date": po.order_date.isoformat() if po.order_date else "",
        "expected_date": po.expected_date.isoformat() if po.expected_date else None,
        "status": po.status,
        "payment_status": po.payment_status or "unpaid",
        "total_amount": float(po.total_amount),
        "supplier": {
            "name": po.supplier.name,
            "contact_name": po.supplier.contact_name,
            "phone": po.supplier.phone,
            "email": po.supplier.email,
            "address": po.supplier.address
        },
        "warehouse": {
            "name": po.warehouse.name if po.warehouse else "Not specified",
            "location": po.warehouse.location if po.warehouse else ""
        } if po.warehouse else None,
        "items": [
            {
                "item_name": item.item.name,
                "quantity_ordered": float(item.quantity_ordered),
                "unit": item.item.unit or "unit",
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price)
            }
            for item in po.items
        ],
        "company_info": {
            "name": "استوديو كيك KBS",
            "address": "شارع الجمهورية، المعادي، القاهرة",
            "phone": "+20 11 234 5678",
            "email": "orders@kbscakestudio.com"
        }
    }
    
    try:
        # Generate HTML - much cleaner and works perfectly with Arabic!
        html_content = generate_purchase_order_html(po_data, language)
        
        return HTMLResponse(
            content=html_content,
            status_code=200,
            headers={
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": f"inline; filename=PO_{po.id}_{language}.html"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating HTML: {str(e)}")

@router.get("/{po_id}/download-html")
async def download_purchase_order_html(
    po_id: int,
    language: str = Query("ar", description="Language: 'ar' for Arabic, 'en' for English"),
    token: Optional[str] = Query(None, description="Authentication token for direct access"),
    db: Session = Depends(get_db)
):
    """Download HTML purchase order as file - users can save as PDF from browser"""
    
    # Handle authentication
    current_user = None
    if token:
        try:
            from auth import verify_token
            current_user = verify_token(token, db)
            if not current_user:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        raise HTTPException(status_code=401, detail="Authentication required - please provide token parameter")
    
    # Get purchase order with all details  
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.supplier),
        joinedload(models.PurchaseOrder.warehouse),
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    ).filter(models.PurchaseOrder.id == po_id).first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Prepare data for HTML generation (same as above)
    po_data = {
        "id": po.id,
        "order_date": po.order_date.isoformat() if po.order_date else "",
        "expected_date": po.expected_date.isoformat() if po.expected_date else None,
        "status": po.status,
        "payment_status": po.payment_status or "unpaid",
        "total_amount": float(po.total_amount),
        "supplier": {
            "name": po.supplier.name,
            "contact_name": po.supplier.contact_name,
            "phone": po.supplier.phone,
            "email": po.supplier.email,
            "address": po.supplier.address
        },
        "warehouse": {
            "name": po.warehouse.name if po.warehouse else "Not specified",
            "location": po.warehouse.location if po.warehouse else ""
        } if po.warehouse else None,
        "items": [
            {
                "item_name": item.item.name,
                "quantity_ordered": float(item.quantity_ordered),
                "unit": item.item.unit or "unit",
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price)
            }
            for item in po.items
        ],
        "company_info": {
            "name": "استوديو كيك KBS", 
            "address": "شارع الجمهورية، المعادي، القاهرة",
            "phone": "+20 11 234 5678",
            "email": "orders@kbscakestudio.com"
        }
    }
    
    try:
        # Create temporary file
        import tempfile
        filename = f"PO_{po.id}_{language}_{po.order_date.strftime('%Y%m%d')}.html"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_file:
            html_content = generate_purchase_order_html(po_data, language)
            temp_file.write(html_content)
            temp_file_path = temp_file.name
        
        # Return file for download
        return FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating HTML file: {str(e)}")

# =============================
# SUPPLIER PO TEMPLATES
# =============================

def _get_template_from_supplier(supplier: models.Supplier) -> List[dict]:
    """Return template list from supplier.notes JSON"""
    if supplier.notes:
        try:
            data = json.loads(supplier.notes)
            return data.get("po_template", []) if isinstance(data, dict) else []
        except Exception:
            return []
    return []

def _save_template_to_supplier(db: Session, supplier: models.Supplier, template_items: List[dict]):
    """Persist template list to supplier.notes JSON"""
    data = {}
    if supplier.notes:
        try:
            data = json.loads(supplier.notes)
            if not isinstance(data, dict):
                data = {}
        except Exception:
            data = {}
    data["po_template"] = template_items
    supplier.notes = json.dumps(data)
    db.commit()
    db.refresh(supplier)

@router.get("/suppliers/{supplier_id}/po-template", response_model=schemas.PurchaseOrderTemplate)
async def get_supplier_po_template(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    template_items = _get_template_from_supplier(supplier)
    return {"items": template_items}

@router.post("/suppliers/{supplier_id}/po-template", response_model=schemas.PurchaseOrderTemplate)
async def save_supplier_po_template(
    supplier_id: int,
    template: schemas.PurchaseOrderTemplate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    # Validate item IDs exist
    for item in template.items:
        item_exists = db.query(models.Item).filter(models.Item.id == item.item_id).first()
        if not item_exists:
            raise HTTPException(status_code=404, detail=f"Item with ID {item.item_id} not found")
    # Save
    _save_template_to_supplier(db, supplier, [item.dict() for item in template.items])
    return template

@router.get("/items/by-ids")
async def get_items_by_ids(
    ids: str = Query(..., description="Comma separated item ids"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    id_list = [int(i) for i in ids.split(',') if i.isdigit()]
    items = db.query(models.Item).filter(models.Item.id.in_(id_list)).all()
    return [{
        "id": item.id,
        "name": item.name,
        "unit": item.unit,
        "price_per_unit": float(item.price_per_unit) if item.price_per_unit else 0.0
    } for item in items]

@router.patch("/suppliers/{supplier_id}/po-template/items", response_model=schemas.PurchaseOrderTemplate)
async def add_or_update_template_item(
    supplier_id: int,
    item: schemas.PurchaseOrderTemplateItem,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # validate item exists
    if not db.query(models.Item).filter(models.Item.id == item.item_id).first():
        raise HTTPException(status_code=404, detail="Item not found")

    template_items = _get_template_from_supplier(supplier)
    # replace if exists else append
    updated = False
    for t in template_items:
        if t.get("item_id") == item.item_id:
            t["default_quantity"] = item.default_quantity
            updated = True
            break
    if not updated:
        template_items.append(item.dict())

    _save_template_to_supplier(db, supplier, template_items)
    return {"items": template_items}

@router.delete("/suppliers/{supplier_id}/po-template/items/{item_id}")
async def delete_template_item(
    supplier_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    template_items = _get_template_from_supplier(supplier)
    template_items = [t for t in template_items if t.get("item_id") != item_id]
    _save_template_to_supplier(db, supplier, template_items)
    return {"success": True, "items": template_items}

# ==========================================
# PURCHASE ORDER ENDPOINTS
# ==========================================

# Receive / finalize PO into warehouse stock
@router.post("/{po_id}/receive")
async def receive_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Mark a purchase order as received and update warehouse stock quantities"""
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.items)
    ).filter(models.PurchaseOrder.id == po_id).first()

    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status == "Received":
        return {"success": True, "message": "Already received"}

    if not po.warehouse_id:
        raise HTTPException(status_code=400, detail="Purchase order has no warehouse assigned")

    try:
        # Update / create warehouse stock records
        for po_item in po.items:
            stock = db.query(models.WarehouseStock).filter_by(
                warehouse_id=po.warehouse_id,
                ingredient_id=po_item.item_id
            ).first()

            qty = float(po_item.quantity_ordered)
            if stock:
                stock.quantity = (stock.quantity or 0) + qty
            else:
                stock = models.WarehouseStock(
                    warehouse_id=po.warehouse_id,
                    ingredient_id=po_item.item_id,
                    quantity=qty
                )
                db.add(stock)

        po.status = "Received"
        po.updated_at = datetime.utcnow()
        db.commit()
        return {"success": True, "message": "Purchase order received"}
    except Exception as e:
        db.rollback()
        import traceback, sys
        print("❌ ERROR receiving purchase order:")
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for receiving with detailed quantities
@router.post("/{po_id}/receive-with-details")
async def receive_purchase_order_with_details(
    po_id: int,
    receive_data: schemas.PurchaseOrderReceiveRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Receive a purchase order with detailed quantities for each item"""
    print(f"🔍 DEBUG: Receiving PO {po_id} with data: {receive_data}")
    
    po = db.query(models.PurchaseOrder).options(
        joinedload(models.PurchaseOrder.items).joinedload(models.PurchaseOrderItem.item)
    ).filter(models.PurchaseOrder.id == po_id).first()

    if not po:
        print(f"❌ Purchase order {po_id} not found")
        raise HTTPException(status_code=404, detail="Purchase order not found")

    print(f"🔍 DEBUG: PO status: {po.status}, warehouse_id: {po.warehouse_id}")

    if po.status == "Received":
        raise HTTPException(status_code=400, detail="Purchase order already received")

    if not po.warehouse_id:
        print(f"❌ Purchase order {po_id} has no warehouse assigned")
        raise HTTPException(status_code=400, detail="Purchase order has no warehouse assigned")

    try:
        print(f"🔍 DEBUG: Starting to process {len(receive_data.items)} items")
        
        # Track total received amount
        total_received_amount = Decimal('0.00')
        all_items_received = True
        any_items_received = False

        # Process each item
        for item_data in receive_data.items:
            print(f"🔍 DEBUG: Processing item {item_data.id} with quantity {item_data.quantity_received}")
            # Find the purchase order item
            po_item = next((item for item in po.items if item.id == item_data.id), None)
            if not po_item:
                raise HTTPException(status_code=404, detail=f"Purchase order item {item_data.id} not found")

            # Update received quantity
            po_item.quantity_received = item_data.quantity_received
            
            # Update item status
            if item_data.quantity_received == 0:
                po_item.status = "returned"
            elif item_data.quantity_received < po_item.quantity_ordered:
                po_item.status = "partial"
                all_items_received = False
                any_items_received = True
            else:
                po_item.status = "received"
                any_items_received = True

            # Update warehouse stock only if quantity received > 0
            if item_data.quantity_received > 0:
                print(f"🔍 DEBUG: Looking for stock - warehouse_id: {po.warehouse_id}, item_id: {po_item.item_id}")
                stock = db.query(models.WarehouseStock).filter_by(
                    warehouse_id=po.warehouse_id,
                    ingredient_id=po_item.item_id
                ).first()
                print(f"🔍 DEBUG: Stock found: {stock is not None}")

                if stock:
                    print(f"🔍 DEBUG: Updating existing stock from {stock.quantity} to {(stock.quantity or 0) + item_data.quantity_received}")
                    stock.quantity = (stock.quantity or 0) + item_data.quantity_received
                else:
                    print(f"🔍 DEBUG: Creating new stock record")
                    stock = models.WarehouseStock(
                        warehouse_id=po.warehouse_id,
                        ingredient_id=po_item.item_id,
                        quantity=item_data.quantity_received
                    )
                    db.add(stock)
                    print(f"🔍 DEBUG: Added stock to session")

                # Calculate received amount
                unit_price = po_item.unit_price or Decimal('0.00')
                total_received_amount += unit_price * item_data.quantity_received

        # Update purchase order status
        if not any_items_received:
            po.status = "Cancelled"  # All items returned
        else:
            po.status = "Received"
            
        # Update total amount to reflect actual received amount (2 decimal places)
        po.total_amount = total_received_amount.quantize(Decimal('0.01'))
        po.received_date = datetime.utcnow()
        po.received_by = current_user.id
        po.updated_at = datetime.utcnow()

        print(f"🔍 DEBUG: About to commit - PO status: {po.status}, received_by: {po.received_by}, received_date: {po.received_date}")
        db.commit()
        print("✅ DEBUG: Commit successful")
        
        return {
            "success": True,
            "message": "Purchase order received successfully",
            "total_received_amount": float(total_received_amount),
            "status": po.status
        }
        
    except Exception as e:
        db.rollback()
        import traceback, sys
        print("❌ ERROR receiving purchase order:")
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=str(e))

# Return entire purchase order
@router.post("/{po_id}/return")
async def return_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Return/cancel an entire purchase order"""
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id).first()

    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status == "Received":
        raise HTTPException(status_code=400, detail="Cannot return already received order")

    try:
        po.status = "Cancelled"
        po.updated_at = datetime.utcnow()
        
        # Update all items to returned status
        for item in po.items:
            item.status = "returned"
            item.quantity_received = 0

        db.commit()
        
        return {
            "success": True,
            "message": "Purchase order returned successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 