"""
Fixed schemas to match actual database structure
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# ==========================================
# PURCHASE ORDER SCHEMAS (Fixed)
# ==========================================

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    order_date: date
    status: str = "Draft"
    
class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    order_date: Optional[date] = None
    status: Optional[str] = None

class PurchaseOrderItemCreate(BaseModel):
    item_id: int
    quantity_ordered: float
    unit_price: float

class PurchaseOrderItemUpdate(BaseModel):
    quantity_ordered: Optional[float] = None
    unit_price: Optional[float] = None

class PurchaseOrderCreateRequest(BaseModel):
    supplier_id: int
    order_date: date
    status: str = "Draft"
    items: List[PurchaseOrderItemCreate] = []

# ==========================================
# RESPONSE SCHEMAS
# ==========================================

class PurchaseOrderResponse(BaseModel):
    id: int
    supplier_id: int
    order_date: date
    status: str
    total_amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PurchaseOrderWithDetails(PurchaseOrderResponse):
    supplier: Optional[dict] = None
    items: List[dict] = []
    calculated_total: Optional[float] = None
    item_count: int = 0
