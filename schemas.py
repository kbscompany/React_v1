from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from models import UserRole

# User schemas
class UserBase(BaseModel):
    username: str
    role_id: Optional[int] = 3  # Default to Staff
    preferred_language: Optional[str] = 'en'

class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = 3  # Default to Staff

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    preferred_language: Optional[str] = None

class UserRoleResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    username: str
    role_id: int
    is_active: bool
    preferred_language: str
    created_at: datetime
    role: Optional[UserRoleResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Warehouse schemas
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    is_shop: bool = False
    foodics_branch_id: Optional[str] = None
    auto_sync: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    is_shop: Optional[bool] = None
    foodics_branch_id: Optional[str] = None
    auto_sync: Optional[bool] = None

class Warehouse(WarehouseBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Category schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Item schemas
class ItemBase(BaseModel):
    name: str
    unit: Optional[str] = None
    category_id: Optional[int] = None
    price_per_unit: Optional[Decimal] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    category_id: Optional[int] = None
    price_per_unit: Optional[Decimal] = None

class Item(ItemBase):
    id: int
    category: Optional[Category] = None
    
    model_config = ConfigDict(from_attributes=True)

# Item Package schemas
class IngredientPackageBase(BaseModel):
    package_name: str
    quantity_per_package: Decimal
    unit: str
    price_per_package: Optional[Decimal] = None
    weight_per_item: Decimal = Decimal("1.0")
    is_default: bool = False
    is_manual: bool = False

class IngredientPackageCreate(IngredientPackageBase):
    ingredient_id: int

class IngredientPackage(IngredientPackageBase):
    id: int
    ingredient_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class IngredientPackageUpdate(BaseModel):
    package_name: Optional[str] = None
    quantity_per_package: Optional[Decimal] = None
    unit: Optional[str] = None
    price_per_package: Optional[Decimal] = None
    weight_per_item: Optional[Decimal] = None
    is_default: Optional[bool] = None
    is_manual: Optional[bool] = None

# Stock schemas
class StockUpdate(BaseModel):
    warehouse_id: int
    ingredient_id: int
    quantity: Decimal
    reason: str = "Manual Update"
    update_method: str = "base_unit"  # base_unit or package
    package_id: Optional[int] = None
    num_packages: Optional[Decimal] = None
    operation: Optional[str] = None  # set, add, remove

class StockBulkUpdate(BaseModel):
    warehouse_id: int
    updates: List[dict]  # List of {ingredient_id, quantity}
    reason: str = "Excel Upload"

class WarehouseStock(BaseModel):
    warehouse_id: int
    ingredient_id: int
    quantity: Decimal
    item: Item
    
    model_config = ConfigDict(from_attributes=True)

# Stock Movement schemas
class StockMovement(BaseModel):
    id: int
    ingredient_id: int
    warehouse_id: int
    user_id: Optional[int]
    change: Decimal
    reason: str
    timestamp: datetime
    item: Item
    warehouse: Warehouse
    
    model_config = ConfigDict(from_attributes=True)

class StockMovementFilter(BaseModel):
    warehouse_id: Optional[int] = None
    ingredient_id: Optional[int] = None
    category_id: Optional[int] = None
    reason: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Waste schemas
class WasteLogCreate(BaseModel):
    warehouse_id: int
    ingredient_id: int
    quantity: Decimal
    reason: str

class WasteLogUpdate(BaseModel):
    status: str  # approved, rejected
    approved_by: int

class WasteLog(BaseModel):
    id: int
    warehouse_id: int
    ingredient_id: int
    user_id: Optional[int]
    quantity: Decimal
    reason: str
    status: str
    approved_by: Optional[int]
    approval_date: Optional[datetime]
    created_at: datetime
    item: Item
    warehouse: Warehouse
    
    model_config = ConfigDict(from_attributes=True)

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# Excel Template schema
class ExcelTemplateData(BaseModel):
    ingredient_id: int
    ingredient_name: str
    quantity: Decimal
    unit: str
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# TRANSFER TEMPLATE SCHEMAS
# ==========================================

# Transfer Template schemas
class TransferTemplateItemBase(BaseModel):
    ingredient_id: int
    suggested_quantity: Decimal
    notes: Optional[str] = None

class TransferTemplateItemCreate(TransferTemplateItemBase):
    pass

class TransferTemplateItem(TransferTemplateItemBase):
    id: int
    template_id: int
    ingredient: Item
    
    model_config = ConfigDict(from_attributes=True)

class TransferTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_warehouse_id: Optional[int] = None
    target_warehouse_id: Optional[int] = None

class TransferTemplateCreate(TransferTemplateBase):
    items: List[TransferTemplateItemCreate] = []

class TransferTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_warehouse_id: Optional[int] = None
    target_warehouse_id: Optional[int] = None
    is_active: Optional[bool] = None

class TransferTemplate(TransferTemplateBase):
    id: int
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TransferTemplateWithDetails(TransferTemplate):
    items: List[TransferTemplateItem] = []
    source_warehouse: Optional[Warehouse] = None
    target_warehouse: Optional[Warehouse] = None
    creator_username: Optional[str] = None
    total_items: int = 0

# Transfer Order schemas
class TransferOrderItemBase(BaseModel):
    ingredient_id: int
    requested_quantity: Decimal
    accepted_quantity: Optional[Decimal] = None
    returned_quantity: Decimal = Decimal('0')
    wasted_quantity: Decimal = Decimal('0')
    waste_reason: Optional[str] = None

class TransferOrderItemCreate(TransferOrderItemBase):
    pass

class TransferOrderItem(TransferOrderItemBase):
    id: int
    transfer_order_id: int
    ingredient: Item
    
    model_config = ConfigDict(from_attributes=True)

class TransferOrderBase(BaseModel):
    source_warehouse_id: int
    target_warehouse_id: int
    template_id: Optional[int] = None
    notes: Optional[str] = None

class TransferOrderCreate(TransferOrderBase):
    items: List[TransferOrderItemCreate] = []

class TransferOrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class TransferOrder(TransferOrderBase):
    id: int
    status: str
    created_by: Optional[int]
    approved_by: Optional[int]
    received_by: Optional[int]
    created_at: datetime
    approved_at: Optional[datetime]
    received_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class TransferOrderWithDetails(TransferOrder):
    items: List[TransferOrderItem] = []
    template: Optional[TransferTemplate] = None
    source_warehouse: Warehouse
    target_warehouse: Warehouse
    creator_username: Optional[str] = None
    approver_username: Optional[str] = None
    receiver_username: Optional[str] = None
    total_items: int = 0
    total_requested_quantity: Decimal = Decimal('0')


# ==========================================
# EXPENSE LOGGING SYSTEM SCHEMAS
# ==========================================

# Bank Account schemas
class BankAccountBase(BaseModel):
    account_name: str
    account_number: str
    bank_name: str
    branch: Optional[str] = None
    account_type: str = "checking"

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    branch: Optional[str] = None
    account_type: Optional[str] = None
    is_active: Optional[bool] = None

class BankAccount(BankAccountBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class BankAccountWithStats(BankAccount):
    total_cheques: int = 0
    active_cheques: int = 0
    settled_cheques: int = 0

# Safe schemas
class SafeBase(BaseModel):
    name: str
    description: Optional[str] = None
    initial_balance: Decimal = Decimal('0.00')

class SafeCreate(SafeBase):
    pass

class SafeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SafeBalanceUpdate(BaseModel):
    amount: Decimal
    reason: str

class Safe(SafeBase):
    id: int
    current_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SafeWithStats(Safe):
    total_cheques: int = 0
    active_cheques: int = 0
    total_expenses: int = 0
    pending_expenses: int = 0

# Enhanced Cheque schemas
class ChequeRangeCreate(BaseModel):
    bank_account_id: int
    start_number: int
    end_number: int
    description: Optional[str] = None
    prefix: Optional[str] = None  # Optional prefix for cheque numbers

class ChequeAssignToSafe(BaseModel):
    safe_id: int
    cheque_ids: List[int]

class ChequeBase(BaseModel):
    cheque_number: str
    bank_account_id: Optional[int] = None
    amount: Decimal
    issue_date: Optional[datetime] = None
    description: Optional[str] = None

class ChequeCreate(ChequeBase):
    pass

class ChequeUpdate(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Cheque(ChequeBase):
    id: int
    safe_id: Optional[int]
    status: str
    is_assigned_to_safe: bool
    is_settled: bool
    total_expenses: Decimal
    overspent_amount: Decimal
    settled_by_cheque_id: Optional[int]
    settlement_date: Optional[datetime]
    created_by: Optional[int]
    assigned_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChequeWithDetails(Cheque):
    bank_account: BankAccount
    safe: Optional[Safe] = None
    current_expenses_total: Decimal = Decimal('0.00')
    remaining_amount: Decimal = Decimal('0.00')
    is_overspent: bool = False
    expense_count: int = 0
    can_be_used: bool = True

class ChequeSettlementBase(BaseModel):
    overspent_cheque_id: int
    settlement_cheque_id: int
    settlement_amount: Decimal
    safe_id: int
    notes: Optional[str] = None

class ChequeSettlementCreate(ChequeSettlementBase):
    pass

class ChequeSettlement(ChequeSettlementBase):
    id: int
    settled_by: Optional[int]
    settlement_date: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChequeSettlementWithDetails(ChequeSettlement):
    overspent_cheque: Cheque
    settlement_cheque: Cheque
    safe: Safe
    settler_username: Optional[str] = None

# Manual settlement with tolerance
class ManualChequeSettlement(BaseModel):
    overspent_cheque_id: int
    settlement_cheque_id: int
    settlement_amount: Decimal
    tolerance_amount: Decimal = Decimal('10.00')  # Default 10 LE tolerance
    notes: Optional[str] = None

class AvailableSettlementCheque(BaseModel):
    id: int
    cheque_number: str
    amount: Decimal
    bank_account_name: str
    bank_name: str
    is_recommended: bool = False
    difference_amount: Decimal = Decimal('0.00')

# Enhanced Hierarchical Expense Category schemas
class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class ExpenseCategoryCreate(ExpenseCategoryBase):
    parent_id: Optional[int] = None
    sort_order: Optional[int] = 0

class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class ExpenseCategoryMove(BaseModel):
    category_id: int
    new_parent_id: Optional[int] = None
    new_sort_order: Optional[int] = None

class ExpenseCategory(ExpenseCategoryBase):
    id: int
    parent_id: Optional[int]
    path: Optional[str]
    level: int
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ExpenseCategoryWithStats(ExpenseCategory):
    expense_count: int = 0
    total_expense_count: int = 0
    can_delete: bool = True
    full_path: str = ""

class ExpenseCategoryTree(ExpenseCategory):
    children: List['ExpenseCategoryTree'] = []
    expense_count: int = 0
    total_expense_count: int = 0
    can_delete: bool = True
    full_path: str = ""

# Expense reassignment
class ExpenseReassignRequest(BaseModel):
    expense_ids: List[int]
    new_category_id: int
    reason: Optional[str] = None

class ExpenseReassignResponse(BaseModel):
    success: bool
    reassigned_count: int
    failed_expenses: List[int] = []
    message: str

# Category bulk operations
class CategoryBulkDeleteRequest(BaseModel):
    category_ids: List[int]
    force_delete: bool = False  # Delete even if has expenses (move expenses to parent)
    
class CategoryBulkDeleteResponse(BaseModel):
    success: bool
    deleted_count: int
    failed_categories: List[Dict[str, Any]] = []
    message: str

# Category import/export
class CategoryImportItem(BaseModel):
    name: str
    description: Optional[str] = None
    parent_path: Optional[str] = None  # Full path to parent (e.g., "Office/Equipment")
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = 0

class CategoryExportItem(ExpenseCategory):
    parent_path: Optional[str] = None
    children_count: int = 0

class CategoryImportResponse(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    failed_items: List[Dict[str, Any]] = []
    message: str

# Expense File schemas
class ExpenseFileBase(BaseModel):
    original_filename: str
    file_size: int
    mime_type: str

class ExpenseFile(ExpenseFileBase):
    id: int
    expense_id: int
    filename: str
    file_path: str
    uploaded_by: Optional[int]
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Expense schemas
class ExpenseBase(BaseModel):
    cheque_id: int
    category_id: Optional[int] = None
    amount: Decimal
    description: Optional[str] = None
    expense_date: datetime
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    expense_date: Optional[datetime] = None
    notes: Optional[str] = None

class ExpenseApproval(BaseModel):
    status: str  # approved, rejected
    notes: Optional[str] = None

class Expense(ExpenseBase):
    id: int
    created_by: Optional[int]
    approved_by: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ExpenseWithDetails(Expense):
    category: Optional[ExpenseCategory] = None
    cheque: ChequeWithDetails
    files: List[ExpenseFile] = []
    creator_username: Optional[str] = None
    approver_username: Optional[str] = None

# Warehouse Manager Assignment schemas
class WarehouseManagerAssignmentBase(BaseModel):
    user_id: int
    warehouse_id: int
    can_view_stock: bool = True
    can_create_transfers_out: bool = True
    can_receive_transfers: bool = True
    can_manage_stock: bool = True

class WarehouseManagerAssignmentCreate(WarehouseManagerAssignmentBase):
    pass

class WarehouseManagerAssignmentUpdate(BaseModel):
    can_view_stock: Optional[bool] = None
    can_create_transfers_out: Optional[bool] = None
    can_receive_transfers: Optional[bool] = None
    can_manage_stock: Optional[bool] = None

class WarehouseManagerAssignment(WarehouseManagerAssignmentBase):
    id: int
    assigned_by: Optional[int]
    assigned_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class WarehouseManagerAssignmentWithDetails(WarehouseManagerAssignment):
    user_username: str
    warehouse_name: str
    assigner_username: Optional[str] = None

# User Safe Assignment schemas
class UserSafeAssignmentBase(BaseModel):
    user_id: int
    safe_id: int
    can_view: bool = True
    can_create_expense: bool = True
    can_approve_expense: bool = False

class UserSafeAssignmentCreate(UserSafeAssignmentBase):
    pass

class UserSafeAssignmentUpdate(BaseModel):
    can_view: Optional[bool] = None
    can_create_expense: Optional[bool] = None
    can_approve_expense: Optional[bool] = None

class UserSafeAssignment(UserSafeAssignmentBase):
    id: int
    assigned_by: Optional[int]
    assigned_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserSafeAssignmentWithDetails(UserSafeAssignment):
    user_username: str
    safe_name: str
    assigner_username: Optional[str] = None

# Audit Log schemas
class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    description: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    safe_id: Optional[int]
    cheque_id: Optional[int]
    expense_id: Optional[int]
    user_id: Optional[int]
    old_values: Optional[str]
    new_values: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AuditLogWithDetails(AuditLog):
    user_username: Optional[str] = None
    safe_name: Optional[str] = None

# File Upload schema
class FileUploadResponse(BaseModel):
    filename: str
    file_size: int
    mime_type: str
    upload_url: Optional[str] = None

# Summary schemas
class ExpenseSummary(BaseModel):
    total_safes: int
    total_cheques: int
    total_expenses: int
    total_amount: Decimal
    pending_amount: Decimal
    approved_amount: Decimal

class SafeSummary(BaseModel):
    safe_id: int
    safe_name: str
    current_balance: Decimal
    total_cheques: int
    total_expenses: int
    total_expense_amount: Decimal
    pending_expenses: int
    pending_amount: Decimal

class BankAccountSummary(BaseModel):
    bank_account_id: int
    account_name: str
    bank_name: str
    total_cheques: int
    assigned_cheques: int
    settled_cheques: int
    active_cheques: int

# Auto-settlement response
class AutoSettlementResult(BaseModel):
    settlement_performed: bool
    overspent_cheque_id: Optional[int] = None
    settlement_cheque_id: Optional[int] = None
    settlement_amount: Optional[Decimal] = None
    message: str

# Early Settlement schemas
class EarlySettlementBase(BaseModel):
    cheque_id: int
    deposit_number: str
    deposit_amount: Decimal
    deposit_date: datetime
    bank_deposit_reference: Optional[str] = None
    notes: Optional[str] = None

class EarlySettlementCreate(EarlySettlementBase):
    pass

class EarlySettlementUpdate(BaseModel):
    deposit_number: Optional[str] = None
    deposit_amount: Optional[Decimal] = None
    deposit_date: Optional[datetime] = None
    bank_deposit_reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class EarlySettlementApproval(BaseModel):
    status: str  # approved, rejected
    notes: Optional[str] = None

class EarlySettlement(EarlySettlementBase):
    id: int
    status: str
    settlement_date: Optional[datetime]
    created_by: Optional[int]
    approved_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Early Settlement File schemas
class EarlySettlementFileBase(BaseModel):
    original_filename: str
    file_size: int
    mime_type: str
    file_type: str = "deposit_screenshot"

class EarlySettlementFile(EarlySettlementFileBase):
    id: int
    early_settlement_id: int
    filename: str
    file_path: str
    uploaded_by: Optional[int]
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EarlySettlementWithDetails(EarlySettlement):
    cheque: ChequeWithDetails
    attachments: List[EarlySettlementFile] = []
    creator_username: Optional[str] = None
    approver_username: Optional[str] = None

# Early Settlement creation with file upload
class EarlySettlementCreateWithFile(BaseModel):
    cheque_id: int
    deposit_number: str
    deposit_amount: Decimal
    deposit_date: datetime
    bank_deposit_reference: Optional[str] = None
    notes: Optional[str] = None

# Sub Recipe schemas
class SubRecipeBase(BaseModel):
    name: str

class SubRecipeCreate(SubRecipeBase):
    pass

class SubRecipeIngredientCreate(BaseModel):
    ingredient_id: int
    quantity: Decimal

class SubRecipeNestedCreate(BaseModel):
    sub_recipe_id: int
    quantity: Decimal

class SubRecipeDetail(BaseModel):
    sub_recipe_id: int
    sub_recipe_name: str
    quantity: Decimal

class SubRecipe(SubRecipeBase):
    id: int
    ingredients: List[dict] = []
    nested_sub_recipes: List[dict] = []
    
    model_config = ConfigDict(from_attributes=True)

class SubRecipeCreateRequest(BaseModel):
    name: str
    ingredients: List[SubRecipeIngredientCreate] = []
    nested_sub_recipes: List[SubRecipeNestedCreate] = []

class SubRecipeUpdate(BaseModel):
    name: Optional[str] = None

class SubRecipeIngredientUpdate(BaseModel):
    quantity: Optional[Decimal] = None

class SubRecipeIngredient(BaseModel):
    id: int
    sub_recipe_id: int
    ingredient_id: int
    quantity: Decimal
    
    model_config = ConfigDict(from_attributes=True)

# Mid Prep Recipe schemas
class MidPrepRecipeBase(BaseModel):
    name: str

class MidPrepRecipeCreate(MidPrepRecipeBase):
    pass

class MidPrepIngredientCreate(BaseModel):
    ingredient_id: int
    quantity: float  # Database uses FLOAT

class MidPrepRecipe(MidPrepRecipeBase):
    id: int
    ingredients: List[dict] = []
    
    model_config = ConfigDict(from_attributes=True)

class MidPrepRecipeCreateRequest(BaseModel):
    name: str
    ingredients: List[MidPrepIngredientCreate]

class MidPrepRecipeUpdate(BaseModel):
    name: Optional[str] = None

class MidPrepIngredientUpdate(BaseModel):
    quantity: Optional[float] = None

class MidPrepIngredient(BaseModel):
    id: int
    mid_prep_id: int
    ingredient_id: int
    quantity: float  # Database uses FLOAT
    
    model_config = ConfigDict(from_attributes=True)

# Cake schemas
class CakeBase(BaseModel):
    name: str
    percent_yield: Decimal = Decimal("100.0")

class CakeCreate(CakeBase):
    pass

class CakeIngredientCreate(BaseModel):
    ingredient_or_subrecipe_id: int
    is_subrecipe: bool = False
    quantity: Decimal

class CakeMidPrepCreate(BaseModel):
    mid_prep_id: int
    quantity: Decimal

class Cake(CakeBase):
    id: int
    ingredients: List[dict] = []
    mid_preps: List[dict] = []
    
    model_config = ConfigDict(from_attributes=True)

class CakeCreateRequest(BaseModel):
    name: str
    percent_yield: Decimal = Decimal("100.0")
    ingredients: List[CakeIngredientCreate] = []
    mid_preps: List[CakeMidPrepCreate] = []

class CakeUpdate(BaseModel):
    name: Optional[str] = None
    percent_yield: Optional[Decimal] = None

class CakeIngredientUpdate(BaseModel):
    quantity: Optional[Decimal] = None

class CakeMidPrepUpdate(BaseModel):
    quantity: Optional[Decimal] = None

# Add Item with Packages request
class ItemWithPackagesCreate(BaseModel):
    name: str
    unit: str
    price_per_unit: Decimal = Decimal("0.0")
    category_id: Optional[int] = None
    packages: List[IngredientPackageBase] = []

# ==========================================
# BATCH PRODUCTION CALCULATOR SCHEMAS  
# ==========================================

class BatchSessionItemBase(BaseModel):
    cake_id: int
    quantity: Decimal

class BatchSessionItemCreate(BatchSessionItemBase):
    pass

class BatchSessionItem(BatchSessionItemBase):
    id: int
    session_id: int
    cake: Cake
    
    model_config = ConfigDict(from_attributes=True)

class BatchSessionBase(BaseModel):
    session_name: str
    description: Optional[str] = None

class BatchSessionCreate(BatchSessionBase):
    items: List[BatchSessionItemCreate] = []

class BatchSessionUpdate(BaseModel):
    session_name: Optional[str] = None
    description: Optional[str] = None
    total_cost: Optional[Decimal] = None

class BatchSession(BatchSessionBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    total_cost: Decimal
    
    model_config = ConfigDict(from_attributes=True)

class BatchSessionWithDetails(BatchSession):
    items: List[BatchSessionItem] = []
    creator_username: Optional[str] = None
    item_count: int = 0

class BatchCalculationRequest(BaseModel):
    cake_quantities: Dict[int, Decimal]  # cake_id -> quantity

class BatchIngredientResult(BaseModel):
    ingredient_id: int
    ingredient_name: str
    quantity: Decimal
    unit: str
    cost: Decimal

class BatchSubRecipeResult(BaseModel):
    sub_recipe_name: str
    quantity_used: Decimal
    unit_cost: Decimal
    total_cost: Decimal

class BatchCalculationResult(BaseModel):
    total_ingredients: List[BatchIngredientResult]
    sub_recipe_summary: List[BatchSubRecipeResult]
    total_cost: Decimal
    calculation_details: List[Dict[str, Any]] = []

class CakeSearchResult(BaseModel):
    id: int
    name: str
    
class BatchSessionSaveRequest(BaseModel):
    session_name: str
    description: Optional[str] = None
    cake_quantities: Dict[int, Decimal]
    total_cost: Optional[Decimal] = None 

# ==========================================
# PURCHASE ORDER SYSTEM SCHEMAS
# ==========================================

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class Supplier(SupplierBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class SupplierWithStats(Supplier):
    total_purchase_orders: int = 0
    total_items: int = 0
    total_packages: int = 0

# Supplier Item schemas
class SupplierItemBase(BaseModel):
    supplier_id: int
    item_id: int
    supplier_price: Optional[Decimal] = None

class SupplierItemCreate(SupplierItemBase):
    pass

class SupplierItemUpdate(BaseModel):
    supplier_price: Optional[Decimal] = None

class SupplierItem(SupplierItemBase):
    item: Item
    
    model_config = ConfigDict(from_attributes=True)

# Supplier Package schemas
class SupplierPackageBase(BaseModel):
    item_id: int
    supplier_id: int
    package_size_kg: Decimal
    price_per_package: Decimal
    last_updated: date

class SupplierPackageCreate(SupplierPackageBase):
    pass

class SupplierPackageUpdate(BaseModel):
    package_size_kg: Optional[Decimal] = None
    price_per_package: Optional[Decimal] = None
    last_updated: Optional[date] = None

class SupplierPackage(SupplierPackageBase):
    id: int
    item: Item
    supplier: Supplier
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SupplierPackageWithPrice(SupplierPackage):
    price_per_kg: Decimal = Decimal('0.00')

# Purchase Order Item schemas
class PurchaseOrderItemBase(BaseModel):
    item_id: int
    quantity_ordered: Decimal
    unit_price: Decimal

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemUpdate(BaseModel):
    quantity_ordered: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    total_price: Decimal
    quantity_received: Optional[Decimal] = None
    status: Optional[str] = "pending"
    item: Item
    
    model_config = ConfigDict(from_attributes=True)

# Purchase Order schemas
class PurchaseOrderBase(BaseModel):
    supplier_id: int
    order_date: date
    expected_date: Optional[date] = None  # Fixed: matches database column name
    warehouse_id: Optional[int] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate] = []

# Alias kept for backward compatibility
class PurchaseOrderCreateRequest(PurchaseOrderCreate):
    warehouse_id: Optional[int] = None

class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    order_date: Optional[date] = None
    expected_date: Optional[date] = None  # Fixed: matches database column name
    status: Optional[str] = None
    warehouse_id: Optional[int] = None

class PurchaseOrder(PurchaseOrderBase):
    id: int
    status: str
    payment_status: Optional[str] = "unpaid"
    payment_date: Optional[datetime] = None
    paid_by: Optional[int] = None
    payment_cheque_id: Optional[int] = None
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    warehouse: Optional["Warehouse"] = None
    
    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderWithDetails(PurchaseOrder):
    supplier_name: Optional[str] = None  # For quick display in frontend
    priority: Optional[str] = "medium"
    supplier: Supplier
    items: List[PurchaseOrderItem] = []
    calculated_total: Decimal = Decimal('0.00')
    item_count: int = 0

# Purchase Order Receive schemas
class PurchaseOrderReceiveItemData(BaseModel):
    id: int  # PurchaseOrderItem id
    quantity_received: Decimal
    status: Optional[str] = None  # 'received', 'partial', 'returned'

class PurchaseOrderReceiveRequest(BaseModel):
    items: List[PurchaseOrderReceiveItemData]

# ==========================================
# FOODICS INTEGRATION SCHEMAS
# ==========================================

class FoodicsTokenBase(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: datetime

class FoodicsTokenCreate(FoodicsTokenBase):
    pass

class FoodicsTokenUpdate(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None

class FoodicsToken(FoodicsTokenBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Purchase Order Cheque Response Schema
class PurchaseOrderChequeResponse(BaseModel):
    success: bool
    message: str
    cheque_id: Optional[int] = None
    cheque_number: Optional[str] = None

class PurchaseOrderChequeRequest(BaseModel):
    bank_account_id: Optional[int] = None  # For new cheques
    safe_id: int
    description: Optional[str] = None
    cheque_number: Optional[str] = None  # For new cheques
    existing_cheque_id: Optional[int] = None  # For using existing cheque
    amount: Optional[Decimal] = None  # Override amount

# Purchase Order Template schemas
class PurchaseOrderTemplateItem(BaseModel):
    item_id: int
    item_name: str
    quantity: Decimal
    unit_price: Decimal

class PurchaseOrderTemplate(BaseModel):
    supplier_id: int
    items: List[PurchaseOrderTemplateItem] = []
    total_items: int = 0
    last_updated: Optional[datetime] = None 