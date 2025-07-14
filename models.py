from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, DECIMAL, Enum, UniqueConstraint, Date, Index, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    WAREHOUSE_MANAGER = "Warehouse Manager"
    KITCHEN_MANAGER = "Kitchen Manager"
    PRODUCTION_STAFF = "Production Staff"
    INVENTORY_STAFF = "Inventory Staff"
    FINANCE_STAFF = "Finance Staff"
    STAFF = "Staff"

class UserRole(Base):
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("user_roles.id"), nullable=False, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    role = relationship("UserRole", back_populates="users")
    stock_movements = relationship("StockMovement", back_populates="user")
    waste_logs = relationship("WasteLog", back_populates="user", foreign_keys="[WasteLog.user_id]")
    approved_waste_logs = relationship("WasteLog", back_populates="approver", foreign_keys="[WasteLog.approved_by]")
    warehouse_assignments = relationship("WarehouseManagerAssignment", foreign_keys="[WarehouseManagerAssignment.user_id]", back_populates="user")

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    location = Column(String(200))
    # Shop integration flags
    is_shop = Column(Boolean, default=False)  # When true this warehouse behaves like a retail branch / shop
    foodics_branch_id = Column(String(50), unique=True, nullable=True)  # UID provided by Foodics API
    auto_sync = Column(Boolean, default=True)  # If false skip scheduled Foodics synchronisation for this shop
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    stock = relationship("WarehouseStock", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse")
    waste_logs = relationship("WasteLog", back_populates="warehouse")
    manager_assignments = relationship("WarehouseManagerAssignment", back_populates="warehouse")

class InventoryCategory(Base):
    __tablename__ = "inventory_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    items = relationship("Item", back_populates="category")

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    unit = Column(String(50), nullable=True)
    price_per_unit = Column(DECIMAL(10, 2), nullable=True)
    category_id = Column(Integer, ForeignKey("inventory_categories.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    category = relationship("InventoryCategory", back_populates="items")
    packages = relationship("IngredientPackage", back_populates="ingredient")
    stock = relationship("WarehouseStock", back_populates="item")
    stock_movements = relationship("StockMovement", back_populates="item")
    waste_logs = relationship("WasteLog", back_populates="item")
    sub_recipe_ingredients = relationship("SubRecipeIngredient", back_populates="ingredient")
    mid_prep_ingredients = relationship("MidPrepIngredient", back_populates="ingredient")

class IngredientPackage(Base):
    __tablename__ = "ingredient_packages"
    
    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    package_name = Column(String(100), nullable=False)
    quantity_per_package = Column(DECIMAL(10, 3), nullable=False)
    unit = Column(String(50), nullable=False)
    price_per_package = Column(DECIMAL(10, 2))
    weight_per_item = Column(DECIMAL(10, 4), nullable=False, default=1.0)
    is_default = Column(Boolean, default=False)
    is_manual = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ingredient = relationship("Item", back_populates="packages")

class WarehouseStock(Base):
    __tablename__ = "warehouse_stock"
    
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), primary_key=True)
    quantity = Column(DECIMAL(12, 3), nullable=True, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="stock")
    item = relationship("Item", back_populates="stock")
    
    @property
    def total_weight(self):
        return self.quantity
    
    @total_weight.setter
    def total_weight(self, value):
        self.quantity = value

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    change = Column(DECIMAL(10, 3), nullable=False)
    reason = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    item = relationship("Item", back_populates="stock_movements")
    warehouse = relationship("Warehouse", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")

class WasteLog(Base):
    __tablename__ = "waste_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    quantity = Column(DECIMAL(10, 3), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    approval_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="waste_logs")
    item = relationship("Item", back_populates="waste_logs")
    user = relationship("User", back_populates="waste_logs", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])

class SubRecipe(Base):
    __tablename__ = "sub_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    
    # Relationships
    ingredients = relationship("SubRecipeIngredient", back_populates="sub_recipe")
    nested_sub_recipes = relationship("SubRecipeNested", back_populates="parent_sub_recipe", foreign_keys="[SubRecipeNested.parent_sub_recipe_id]")
    used_in_sub_recipes = relationship("SubRecipeNested", back_populates="child_sub_recipe", foreign_keys="[SubRecipeNested.sub_recipe_id]")

class SubRecipeIngredient(Base):
    __tablename__ = "sub_recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    sub_recipe_id = Column(Integer, ForeignKey("sub_recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(DECIMAL(10, 3), nullable=False)  # Database uses DECIMAL(10,3)
    
    # Relationships
    sub_recipe = relationship("SubRecipe", back_populates="ingredients")
    ingredient = relationship("Item")

class SubRecipeNested(Base):
    __tablename__ = "sub_recipe_nested"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_sub_recipe_id = Column(Integer, ForeignKey("sub_recipes.id", ondelete="CASCADE"), nullable=False)
    sub_recipe_id = Column(Integer, ForeignKey("sub_recipes.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(DECIMAL(10, 4), nullable=False)
    
    # Relationships
    parent_sub_recipe = relationship("SubRecipe", back_populates="nested_sub_recipes", foreign_keys=[parent_sub_recipe_id])
    child_sub_recipe = relationship("SubRecipe", back_populates="used_in_sub_recipes", foreign_keys=[sub_recipe_id])

class MidPrepRecipe(Base):
    __tablename__ = "mid_prep_recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    
    # Relationships
    ingredients = relationship("MidPrepIngredient", back_populates="mid_prep")
    used_in_cakes = relationship("CakeMidPrep", back_populates="mid_prep")

class MidPrepIngredient(Base):
    __tablename__ = "mid_prep_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    mid_prep_id = Column(Integer, ForeignKey("mid_prep_recipes.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=False)  # Database uses FLOAT not DECIMAL
    
    # Relationships
    mid_prep = relationship("MidPrepRecipe", back_populates="ingredients")
    ingredient = relationship("Item")

class MidPrepSubrecipe(Base):
    __tablename__ = "mid_prep_subrecipes"
    
    id = Column(Integer, primary_key=True, index=True)
    mid_prep_id = Column(Integer, ForeignKey("mid_prep_recipes.id", ondelete="CASCADE"), nullable=False)
    sub_recipe_id = Column(Integer, ForeignKey("sub_recipes.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(DECIMAL(10, 5), nullable=False)
    
    # Relationships
    mid_prep = relationship("MidPrepRecipe", backref="subrecipes")
    sub_recipe = relationship("SubRecipe")

class Cake(Base):
    __tablename__ = "cakes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    percent_yield = Column(DECIMAL(10, 4), default=100.0)
    
    # Relationships
    ingredients = relationship("CakeIngredient", back_populates="cake")
    mid_preps = relationship("CakeMidPrep", back_populates="cake")

class CakeIngredient(Base):
    __tablename__ = "cake_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    cake_id = Column(Integer, ForeignKey("cakes.id", ondelete="CASCADE"), nullable=False)
    ingredient_or_subrecipe_id = Column(Integer, nullable=False)
    is_subrecipe = Column(Boolean, default=False)
    quantity = Column(DECIMAL(10, 5), nullable=False)
    
    # Relationships
    cake = relationship("Cake", back_populates="ingredients")
    ingredient = relationship("Item", 
                            foreign_keys=[ingredient_or_subrecipe_id],
                            primaryjoin="and_(CakeIngredient.ingredient_or_subrecipe_id==Item.id, CakeIngredient.is_subrecipe==False)")
    sub_recipe = relationship("SubRecipe",
                            foreign_keys=[ingredient_or_subrecipe_id],
                            primaryjoin="and_(CakeIngredient.ingredient_or_subrecipe_id==SubRecipe.id, CakeIngredient.is_subrecipe==True)")

class CakeMidPrep(Base):
    __tablename__ = "cake_mid_prep"
    
    id = Column(Integer, primary_key=True, index=True)
    cake_id = Column(Integer, ForeignKey("cakes.id", ondelete="CASCADE"), nullable=False)
    mid_prep_id = Column(Integer, ForeignKey("mid_prep_recipes.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(DECIMAL(10, 5), nullable=False)
    
    # Relationships
    cake = relationship("Cake", back_populates="mid_preps")
    mid_prep = relationship("MidPrepRecipe", back_populates="used_in_cakes")


# ==========================================
# TRANSFER TEMPLATE MODELS
# ==========================================

class TransferTemplate(Base):
    """Templates for warehouse transfer orders"""
    __tablename__ = "transfer_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    target_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    items = relationship("TransferTemplateItem", back_populates="template")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    target_warehouse = relationship("Warehouse", foreign_keys=[target_warehouse_id])
    creator = relationship("User", foreign_keys=[created_by])
    transfer_orders = relationship("TransferOrder", back_populates="template")

class TransferTemplateItem(Base):
    """Items in transfer templates with suggested quantities"""
    __tablename__ = "transfer_template_items"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("transfer_templates.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    suggested_quantity = Column(DECIMAL(12, 3), nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    template = relationship("TransferTemplate", back_populates="items")
    ingredient = relationship("Item")

class TransferOrder(Base):
    """Actual transfer orders between warehouses"""
    __tablename__ = "transfer_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("transfer_templates.id", ondelete="SET NULL"), nullable=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    target_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending")  # pending, in_transit, completed, cancelled
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    received_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    template = relationship("TransferTemplate", back_populates="transfer_orders")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    target_warehouse = relationship("Warehouse", foreign_keys=[target_warehouse_id])
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    receiver = relationship("User", foreign_keys=[received_by])
    items = relationship("TransferOrderItem", back_populates="transfer_order")

class TransferOrderItem(Base):
    """Items in transfer orders with actual quantities"""
    __tablename__ = "transfer_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    transfer_order_id = Column(Integer, ForeignKey("transfer_orders.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    requested_quantity = Column(DECIMAL(12, 3), nullable=False)
    accepted_quantity = Column(DECIMAL(12, 3), nullable=True)
    returned_quantity = Column(DECIMAL(12, 3), default=0)
    wasted_quantity = Column(DECIMAL(12, 3), default=0)
    waste_reason = Column(Text, nullable=True)
    
    # Relationships
    transfer_order = relationship("TransferOrder", back_populates="items")
    ingredient = relationship("Item")


# ==========================================
# EXPENSE LOGGING SYSTEM MODELS
# ==========================================

# NEW: Bank model
class Bank(Base):
    """Banks that hold our accounts"""
    __tablename__ = "banks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    short_name = Column(String(20), unique=True, nullable=False)
    swift_code = Column(String(20), nullable=True)
    country = Column(String(50), default="Egypt")
    address = Column(Text, nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bank_accounts = relationship("BankAccount", back_populates="bank")
    
    @property
    def total_accounts(self):
        """Get total number of accounts in this bank"""
        return len(self.bank_accounts)
    
    @property
    def active_accounts(self):
        """Get number of active accounts"""
        return len([acc for acc in self.bank_accounts if acc.is_active])
    
    @property
    def total_active_cheque_books(self):
        """Get total active cheque books across all accounts"""
        count = 0
        for account in self.bank_accounts:
            if account.active_cheque_book:
                count += 1
        return count

class BankAccount(Base):
    """Bank accounts for cheque creation and management"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=True)
    account_name = Column(String(200), nullable=False)
    account_number = Column(String(100), unique=True, nullable=False)
    bank_name = Column(String(100), nullable=False)
    branch = Column(String(100), nullable=True)
    account_type = Column(String(20), default="checking")  # checking, savings, business, other
    currency = Column(String(10), default="EGP")
    opening_balance = Column(DECIMAL(15, 2), default=0.00)
    current_balance = Column(DECIMAL(15, 2), default=0.00)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    can_issue_cheques = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bank = relationship("Bank", back_populates="bank_accounts")
    cheque_books = relationship("ChequeBook", back_populates="bank_account")
    cheques = relationship("Cheque", back_populates="bank_account")
    creator = relationship("User", foreign_keys=[created_by])
    
    @property
    def full_account_name(self):
        """Get full account name including bank"""
        return f"{self.bank.short_name} - {self.account_name}" if self.bank else self.account_name
    
    @property
    def active_cheque_book(self):
        """Get the currently active cheque book for this account"""
        return next((book for book in self.cheque_books if book.status == 'active'), None)
    
    @property
    def can_create_new_cheque_book(self):
        """Check if a new cheque book can be created (no active books)"""
        return self.active_cheque_book is None
    
    @property
    def total_cheques_issued(self):
        """Get total number of cheques issued from this account"""
        return len(self.cheques)
    
    @property
    def available_balance(self):
        """Get available balance"""
        return float(self.current_balance)

# NEW: ChequeBook model
class ChequeBook(Base):
    """Cheque books with status management and one-active-per-account constraint"""
    __tablename__ = "cheque_books"
    
    id = Column(Integer, primary_key=True, index=True)
    book_number = Column(String(50), unique=True, nullable=False)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    
    # Book details
    series = Column(String(10), nullable=True)
    book_type = Column(String(20), default="standard")
    start_cheque_number = Column(String(50), nullable=False)
    end_cheque_number = Column(String(50), nullable=False)
    total_cheques = Column(Integer, nullable=False)
    prefix = Column(String(10), nullable=True)
    
    # Status management
    status = Column(String(20), default="active")  # active, closed, cancelled, exhausted
    
    # Tracking
    issued_date = Column(DateTime(timezone=True), server_default=func.now())
    activated_date = Column(DateTime(timezone=True), nullable=True)
    closed_date = Column(DateTime(timezone=True), nullable=True)
    closed_reason = Column(Text, nullable=True)
    closed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bank_account = relationship("BankAccount", back_populates="cheque_books")
    # cheques = relationship("Cheque", back_populates="cheque_book")  # Commented out - cheque_book_id column doesn't exist
    creator = relationship("User", foreign_keys=[created_by])
    closer = relationship("User", foreign_keys=[closed_by])
    
    @property
    def bank(self):
        """Get the bank through the account relationship"""
        return self.bank_account.bank if self.bank_account else None
    
    @property
    def can_be_closed(self):
        """Check if cheque book can be closed (all cheques settled or cancelled)"""
        for cheque in self.cheques:
            if cheque.status not in ['settled', 'cancelled']:
                return False
        return True
    
    @property
    def usage_percentage(self):
        """Get percentage of cheques used"""
        if not self.cheques:
            return 0
        used = len([c for c in self.cheques if c.status != 'created'])
        return (used / len(self.cheques)) * 100
    
    @property
    def cheques_summary(self):
        """Get summary of cheques in this book"""
        summary = {
            'total': len(self.cheques),
            'created': 0,
            'assigned': 0,
            'active': 0,
            'overspent': 0,
            'settled': 0,
            'cancelled': 0,
            'used': 0,
            'available': 0
        }
        
        for cheque in self.cheques:
            if cheque.status in summary:
                summary[cheque.status] += 1
            
            if cheque.status == 'created':
                summary['available'] += 1
            else:
                summary['used'] += 1
                
        return summary

class Safe(Base):
    """Safes where money is stored with balance tracking"""
    __tablename__ = "safes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    initial_balance = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    current_balance = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cheques = relationship("Cheque", back_populates="safe")
    user_assignments = relationship("UserSafeAssignment", back_populates="safe")
    audit_logs = relationship("AuditLog", back_populates="safe")

class Cheque(Base):
    """Enhanced cheques with bank accounts, safe assignment, and settlement"""
    __tablename__ = "cheques"
    
    id = Column(Integer, primary_key=True, index=True)
    cheque_number = Column(String(50), unique=True, nullable=False)
    # cheque_book_id = Column(Integer, ForeignKey("cheque_books.id", ondelete="CASCADE"), nullable=True)  # Column doesn't exist in database
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    safe_id = Column(Integer, ForeignKey("safes.id", ondelete="SET NULL"), nullable=True)  # Assigned later
    amount = Column(DECIMAL(12, 2), nullable=False)
    issue_date = Column(DateTime(timezone=True), nullable=False)  # Auto-set to server time when issued to safe/supplier
    due_date = Column(Date, nullable=True)  # User-selectable date (today or future only)
    description = Column(Text, nullable=True)
    issued_to = Column(String(255), nullable=True)  # Name of the recipient (person or supplier)
    
    # Status tracking
    status = Column(String(20), default="created")  # created, assigned, active, overspent, settled, cancelled
    is_assigned_to_safe = Column(Boolean, default=False)
    is_settled = Column(Boolean, default=False)
    
    # NEW: Supplier payment tracking
    is_supplier_payment = Column(Boolean, default=False)  # Flag for supplier payments
    supplier_invoice_uploaded = Column(Boolean, default=False)  # Track if invoice is uploaded
    supplier_invoice_file_path = Column(String(500), nullable=True)  # Path to uploaded invoice
    supplier_invoice_upload_date = Column(DateTime(timezone=True), nullable=True)
    supplier_invoice_uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Settlement tracking
    total_expenses = Column(DECIMAL(12, 2), default=0.00)
    overspent_amount = Column(DECIMAL(12, 2), default=0.00)
    settled_by_cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="SET NULL"), nullable=True)
    settlement_date = Column(DateTime(timezone=True), nullable=True)
    
    # Creation tracking
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    # cheque_book = relationship("ChequeBook", back_populates="cheques")  # Commented out - column doesn't exist
    bank_account = relationship("BankAccount", back_populates="cheques")
    safe = relationship("Safe", back_populates="cheques")
    expenses = relationship("Expense", back_populates="cheque")
    creator = relationship("User", foreign_keys=[created_by])
    assigner = relationship("User", foreign_keys=[assigned_by])
    settled_by_cheque = relationship("Cheque", foreign_keys=[settled_by_cheque_id], remote_side=[id])
    settlements_made = relationship("Cheque", foreign_keys=[settled_by_cheque_id], remote_side=[settled_by_cheque_id])
    early_settlements = relationship("EarlySettlement", back_populates="cheque")
    # NEW: Relationship for invoice uploader
    invoice_uploader = relationship("User", foreign_keys=[supplier_invoice_uploaded_by])
    
    @property
    def current_expenses_total(self):
        """Calculate current total expenses"""
        return sum(expense.amount for expense in self.expenses if expense.status != 'rejected')
    
    @property
    def remaining_amount(self):
        """Calculate remaining amount (can be negative if overspent)"""
        return self.amount - self.current_expenses_total
    
    @property
    def is_overspent(self):
        """Check if cheque is overspent"""
        return self.current_expenses_total > self.amount
    
    @property
    def supplier_payment_status(self):
        """Get supplier payment status"""
        if not self.is_supplier_payment:
            return None
        if not self.is_settled:
            return "pending_payment"
        if self.is_settled and not self.supplier_invoice_uploaded:
            return "awaiting_invoice"
        if self.is_settled and self.supplier_invoice_uploaded:
            return "completed"
        return "unknown"
    
    def update_status(self):
        """Update cheque status based on current state"""
        if self.is_settled:
            # For supplier payments, check if invoice is uploaded
            if self.is_supplier_payment and not self.supplier_invoice_uploaded:
                self.status = "settled_pending_invoice"  # NEW status
            else:
                self.status = "settled"
        elif self.is_overspent:
            self.status = "overspent"
            self.overspent_amount = self.current_expenses_total - self.amount
        elif self.is_assigned_to_safe and self.current_expenses_total > 0:
            self.status = "active"
        elif self.is_assigned_to_safe:
            self.status = "assigned"
        else:
            self.status = "created"

class ChequeSettlement(Base):
    """Track cheque settlements for audit purposes"""
    __tablename__ = "cheque_settlements"
    
    id = Column(Integer, primary_key=True, index=True)
    overspent_cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="CASCADE"), nullable=False)
    settlement_cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="CASCADE"), nullable=False)
    settlement_amount = Column(DECIMAL(12, 2), nullable=False)
    safe_id = Column(Integer, ForeignKey("safes.id", ondelete="CASCADE"), nullable=False)
    settled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    settlement_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Relationships
    overspent_cheque = relationship("Cheque", foreign_keys=[overspent_cheque_id])
    settlement_cheque = relationship("Cheque", foreign_keys=[settlement_cheque_id])
    safe = relationship("Safe")
    settler = relationship("User")

class ExpenseCategory(Base):
    """Hierarchical categories for expenses with unlimited nesting"""
    __tablename__ = "expense_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="CASCADE"), nullable=True)
    path = Column(String(1000), nullable=True)  # Full path for quick lookup (e.g., "Office/Equipment/Computers")
    level = Column(Integer, default=0)  # Depth level (0 = root, 1 = child, etc.)
    sort_order = Column(Integer, default=0)  # For custom ordering within same parent
    icon = Column(String(50), nullable=True)  # Icon class name (e.g., "fas fa-laptop")
    color = Column(String(7), nullable=True)  # Hex color code (e.g., "#007bff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    parent = relationship("ExpenseCategory", remote_side=[id], back_populates="children")
    children = relationship("ExpenseCategory", back_populates="parent", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="category")
    
    @property
    def full_path(self):
        """Generate full path from root to this category"""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name
    
    @property
    def expense_count(self):
        """Count direct expenses in this category"""
        return len(self.expenses)
    
    @property
    def total_expense_count(self):
        """Count expenses in this category and all subcategories"""
        total = self.expense_count
        for child in self.children:
            total += child.total_expense_count
        return total
    
    @property
    def can_delete(self):
        """Check if category can be deleted (no expenses and no children)"""
        return self.expense_count == 0 and len(self.children) == 0
    
    def update_path(self):
        """Update the path field based on parent hierarchy"""
        if self.parent:
            self.path = f"{self.parent.path}/{self.name}" if self.parent.path else self.name
            self.level = self.parent.level + 1
        else:
            self.path = self.name
            self.level = 0
        
        # Update children paths recursively
        for child in self.children:
            child.update_path()

class Expense(Base):
    """Main expense records"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"))
    amount = Column(DECIMAL(12, 2), nullable=False)
    description = Column(Text, nullable=False)
    paid_to = Column(String(255), nullable=True)  # Name of person/entity who received payment
    expense_date = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    status = Column(String(20), default="pending")  # pending, approved, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cheque = relationship("Cheque", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    files = relationship("ExpenseFile", back_populates="expense")

class ExpenseFile(Base):
    """File attachments for expenses (receipts, documents)"""
    __tablename__ = "expense_files"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    expense = relationship("Expense", back_populates="files")
    uploader = relationship("User", foreign_keys=[uploaded_by])

class UserSafeAssignment(Base):
    """User access control for safes"""
    __tablename__ = "user_safe_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    safe_id = Column(Integer, ForeignKey("safes.id", ondelete="CASCADE"), nullable=False)
    can_view = Column(Boolean, default=True)
    can_create_expense = Column(Boolean, default=True)
    can_approve_expense = Column(Boolean, default=False)
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    safe = relationship("Safe", back_populates="user_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])

class EarlySettlement(Base):
    """Early settlement records with deposit information and attachments"""
    __tablename__ = "early_settlements"
    
    id = Column(Integer, primary_key=True, index=True)
    cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="CASCADE"), nullable=False)
    deposit_number = Column(String(100), nullable=False)
    deposit_amount = Column(DECIMAL(12, 2), nullable=False)
    deposit_date = Column(DateTime(timezone=True), nullable=False)
    bank_deposit_reference = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(String(20), default="pending")  # pending, approved, rejected
    settlement_date = Column(DateTime(timezone=True), nullable=True)
    
    # User tracking
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    cheque = relationship("Cheque")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    attachments = relationship("EarlySettlementFile", back_populates="early_settlement")

class EarlySettlementFile(Base):
    """File attachments for early settlements (deposit screenshots, bank statements)"""
    __tablename__ = "early_settlement_files"
    
    id = Column(Integer, primary_key=True, index=True)
    early_settlement_id = Column(Integer, ForeignKey("early_settlements.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_type = Column(String(50), default="deposit_screenshot")  # deposit_screenshot, bank_statement, other
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    early_settlement = relationship("EarlySettlement", back_populates="attachments")
    uploader = relationship("User", foreign_keys=[uploaded_by])

class AuditLog(Base):
    """Audit trail for all expense system transactions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    safe_id = Column(Integer, ForeignKey("safes.id", ondelete="SET NULL"))
    cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="SET NULL"))
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="SET NULL"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, APPROVE, REJECT
    entity_type = Column(String(50), nullable=False)  # SAFE, CHEQUE, EXPENSE
    old_values = Column(Text, nullable=True)  # JSON string of old values
    new_values = Column(Text, nullable=True)  # JSON string of new values
    description = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    safe = relationship("Safe", back_populates="audit_logs")
    cheque = relationship("Cheque")
    expense = relationship("Expense")
    user = relationship("User")

# ==========================================
# BATCH PRODUCTION CALCULATOR MODELS
# ==========================================

class BatchSession(Base):
    """Batch production sessions for saving and loading calculations"""
    __tablename__ = "batch_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    description = Column(Text, nullable=True)
    total_cost = Column(DECIMAL(10,2), default=0.00)
    
    # Relationships
    items = relationship("BatchSessionItem", back_populates="session", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    
    # Unique constraint to prevent duplicate session names per user
    __table_args__ = (
        UniqueConstraint('session_name', 'created_by', name='unique_session_name_per_user'),
    )

class BatchSessionItem(Base):
    """Items/cakes in batch sessions with quantities"""
    __tablename__ = "batch_session_items"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("batch_sessions.id", ondelete="CASCADE"), nullable=False)
    cake_id = Column(Integer, ForeignKey("cakes.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(DECIMAL(10,5), nullable=False)
    
    # Relationships
    session = relationship("BatchSession", back_populates="items")
    cake = relationship("Cake")

# ==========================================
# WAREHOUSE MANAGER ASSIGNMENT MODELS
# ==========================================

class WarehouseManagerAssignment(Base):
    """User access control for warehouses - defines which warehouses a user can manage"""
    __tablename__ = "warehouse_manager_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    can_view_stock = Column(Boolean, default=True)
    can_create_transfers_out = Column(Boolean, default=True)  # Can create transfers FROM this warehouse
    can_receive_transfers = Column(Boolean, default=True)     # Can receive transfers TO this warehouse
    can_manage_stock = Column(Boolean, default=True)         # Can add/remove stock, waste logs
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    warehouse = relationship("Warehouse", back_populates="manager_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])
    
    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        UniqueConstraint('user_id', 'warehouse_id', name='unique_user_warehouse_assignment'),
    ) 

# ==========================================
# PURCHASE ORDER SYSTEM MODELS
# ==========================================

class Supplier(Base):
    """Suppliers for purchase orders"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    supplier_items = relationship("SupplierItem", back_populates="supplier")
    supplier_packages = relationship("SupplierPackage", back_populates="supplier")

class SupplierItem(Base):
    """Items supplied by suppliers with prices"""
    __tablename__ = "supplier_items"
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), primary_key=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), primary_key=True)
    supplier_price = Column(DECIMAL(10, 2), nullable=True)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_items")
    item = relationship("Item")

class SupplierPackage(Base):
    """Package options from suppliers - references ingredient_packages"""
    __tablename__ = "supplier_packages"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("ingredient_packages.id", ondelete="CASCADE"), nullable=False)
    supplier_package_price = Column(DECIMAL(12, 4), nullable=True)
    lead_time_days = Column(Integer, nullable=True, default=0)
    minimum_order_qty = Column(Integer, nullable=True, default=1)
    is_preferred = Column(Boolean, nullable=True, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_packages")
    package = relationship("IngredientPackage")
    
    @property
    def item(self):
        """Get the item through the package relationship"""
        return self.package.ingredient if self.package else None
    
    @property
    def item_id(self):
        """Get the item_id through the package relationship"""
        return self.package.ingredient_id if self.package else None
    
    @property
    def price_per_package(self):
        """Get price per package - use supplier price if available, otherwise package price"""
        return float(self.supplier_package_price) if self.supplier_package_price else (float(self.package.price_per_package) if self.package and self.package.price_per_package else 0.0)
    
    @property
    def package_size_kg(self):
        """Get package size from the ingredient package"""
        if self.package:
            # Convert to kg based on package quantity and weight per item
            return float(self.package.quantity_per_package) * float(self.package.weight_per_item)
        return 0.0
    
    @property
    def price_per_kg(self):
        """Calculate price per kg"""
        if self.package_size_kg and self.package_size_kg > 0:
            return self.price_per_package / self.package_size_kg
        return 0.0

class PurchaseOrder(Base):
    """Purchase orders to suppliers"""
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_date = Column(Date, nullable=True)  # Fixed: matches actual database column name
    status = Column(Enum('Pending', 'Approved', 'Received', 'Cancelled'), default="Pending")  # Updated: includes Approved status
    payment_status = Column(String(20), default="unpaid")  # unpaid, paid
    payment_date = Column(DateTime(timezone=True), nullable=True)
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    payment_cheque_id = Column(Integer, ForeignKey("cheques.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(DECIMAL(12, 2), nullable=False, default=0.00)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    received_date = Column(DateTime(timezone=True), nullable=True)
    received_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Approval tracking - NEW fields for approval workflow
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    warehouse = relationship("Warehouse")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")
    received_by_user = relationship("User", foreign_keys=[received_by])
    paid_by_user = relationship("User", foreign_keys=[paid_by])
    payment_cheque = relationship("Cheque", foreign_keys=[payment_cheque_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    
    @property
    def calculated_total(self):
        """Calculate total from items"""
        return sum(float(item.total_price) for item in self.items)
    
    def update_total(self):
        """Update the total_amount field"""
        self.total_amount = self.calculated_total

class PurchaseOrderItem(Base):
    """Items in purchase orders"""
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    quantity_ordered = Column(DECIMAL(12, 3), nullable=False)
    quantity_received = Column(DECIMAL(12, 3), nullable=True)
    unit_price = Column(DECIMAL(12, 4), nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    status = Column(String(20), default="pending")  # pending, received, partial, returned
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    item = relationship("Item")
    
    def calculate_total(self):
        """Calculate and update total price"""
        self.total_price = float(self.quantity_ordered) * float(self.unit_price)
        return self.total_price

# ==========================================
# FOODICS INTEGRATION MODELS
# ==========================================

class FoodicsAuthToken(Base):
    """Store long-lived Foodics OAuth tokens (single account setup)"""
    __tablename__ = "foodics_tokens"

    id = Column(Integer, primary_key=True, default=1)  # always single row
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) 