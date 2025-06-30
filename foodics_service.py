import logging
import httpx
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from datetime import datetime

logger = logging.getLogger(__name__)

class FoodicsService:
    """
    Official Foodics Accounting/ERP Integration Service
    Based on: https://developers.foodics.com/guides/accounting/accounting-erp-integration.html
    """
    
    def __init__(self):
        # Official Foodics API base URL from documentation
        self.base_url = "https://api.foodics.dev/v5"
        self.default_headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # Official recommended scopes for Accounting/ERP integration
        self.recommended_scopes = [
            "general.read",                    # Read business general data (branches, warehouses, etc.)
            "orders.list",                     # Fetching order details  
            "inventory.transactions.read",     # Read inventory transactions
            "inventory.settings.read",         # Read inventory data (suppliers, items, etc.)
            "menu.ingredients.read",           # Fetch menu item ingredients
            "customers.accounts.read",         # Read customers' house accounts
            "tokens.limited.revoke"            # Revoke/delete access tokens
        ]
        
        logger.info("🚀 Initialized FoodicsService with official Accounting/ERP integration guidelines")
    
    def _get_headers(self, token: str) -> Dict[str, str]:
        """Get headers with authentication token following official API format"""
        headers = self.default_headers.copy()
        headers["Authorization"] = f"Bearer {token}"
        return headers
    
    async def get_whoami(self, token: str) -> Dict[str, Any]:
        """
        Official /whoami endpoint - First step in Accounting/ERP integration
        Fetches business details for mapping between accounts
        """
        logger.info("🏢 DEBUG: Fetching business information via /whoami")
        try:
            headers = self._get_headers(token)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/whoami"
                logger.info(f"🏢 DEBUG: Making whoami request to: {url}")
                
                response = await client.get(url, headers=headers)
                logger.info(f"🏢 DEBUG: Whoami response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    business_info = data.get("data", {})
                    
                    logger.info(f"🏢 DEBUG: Business name: {business_info.get('business', {}).get('name', 'Unknown')}")
                    logger.info(f"🏢 DEBUG: Business reference: {business_info.get('business', {}).get('reference', 'Unknown')}")
                    
                    return {
                        "success": True,
                        "business_info": business_info,
                        "business_name": business_info.get('business', {}).get('name'),
                        "business_reference": business_info.get('business', {}).get('reference'),
                        "user_info": {
                            "name": business_info.get('name'),
                            "email": business_info.get('email')
                        }
                    }
                else:
                    logger.error(f"🏢 DEBUG: Whoami failed: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"🏢 DEBUG: Whoami exception: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_settings(self, token: str) -> Dict[str, Any]:
        """
        Official /settings endpoint - Get business settings (currency, timezone, etc.)
        """
        logger.info("⚙️ DEBUG: Fetching business settings")
        try:
            headers = self._get_headers(token)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/settings"
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    settings_data = data.get("data", {})
                    
                    return {
                        "success": True,
                        "settings": settings_data,
                        "business_currency": settings_data.get("business_currency"),
                        "business_timezone": settings_data.get("business_timezone"),
                        "tax_settings": settings_data.get("tax_settings", {}),
                        "rounding_settings": settings_data.get("rounding_settings", {})
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"⚙️ DEBUG: Settings exception: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify API token by checking whoami endpoint"""
        logger.info("🔐 DEBUG: Verifying token via whoami endpoint")
        
        whoami_result = await self.get_whoami(token)
        if whoami_result.get("success"):
            return {
                "valid": True,
                "business_name": whoami_result.get("business_name"),
                "business_reference": whoami_result.get("business_reference")
            }
        else:
            return {
                "valid": False,
                "error": whoami_result.get("error"),
                "details": whoami_result.get("details")
            }
    
    async def get_branches(self, token: str) -> Dict[str, Any]:
        """
        Official branches fetching following Accounting/ERP guidelines
        Part of general.read scope
        """
        logger.info("🏢 DEBUG: Fetching branches (official ERP integration)")
        try:
            headers = self._get_headers(token)
            all_branches = []
            page = 1
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                while True:
                    url = f"{self.base_url}/branches"
                    params = {"page": page}
                    logger.info(f"🏢 DEBUG: Fetching branches page {page}")
                    
                    response = await client.get(url, headers=headers, params=params)
                    
                    if response.status_code != 200:
                        logger.error(f"🏢 DEBUG: Branches API error: {response.status_code}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status_code}",
                            "details": response.text
                        }
                    
                    data = response.json()
                    page_branches = data.get("data", [])
                    all_branches.extend(page_branches)
                    
                    # Check pagination
                    meta = data.get("meta", {})
                    if meta.get("current_page", 1) >= meta.get("last_page", 1):
                        break
                    page += 1
            
            logger.info(f"🏢 DEBUG: Retrieved {len(all_branches)} branches total")
            
            # Process branches with ERP-relevant information
            processed_branches = []
            for branch in all_branches:
                processed_branch = {
                    "id": branch.get("id"),
                    "name": branch.get("name", "Unknown"),
                    "reference": branch.get("reference", ""),
                    "type": branch.get("type", 1),
                    "phone": branch.get("phone", ""),
                    "address": branch.get("address", ""),
                    "latitude": branch.get("latitude"),
                    "longitude": branch.get("longitude"),
                    "receives_online_orders": branch.get("receives_online_orders", False),
                    "opening_from": branch.get("opening_from", ""),
                    "opening_to": branch.get("opening_to", ""),
                    "is_active": not branch.get("deleted_at"),  # ERP integration: track active status
                    "created_at": branch.get("created_at", ""),
                    "updated_at": branch.get("updated_at", ""),
                    "deleted_at": branch.get("deleted_at")
                }
                processed_branches.append(processed_branch)
            
            return {
                "success": True,
                "branches": processed_branches,
                "total": len(processed_branches)
            }
            
        except Exception as e:
            logger.error(f"🏢 DEBUG: Exception in get_branches: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_orders_for_accounting(self, token: str, start_date: datetime = None, end_date: datetime = None, reference_after: int = 0) -> Dict[str, Any]:
        """
        Official orders fetching for Accounting/ERP integration
        Includes all necessary entities for accurate price calculation
        Based on official documentation sample
        """
        logger.info(f"💰 DEBUG: Fetching orders for accounting (reference_after: {reference_after})")
        try:
            headers = self._get_headers(token)
            
            # Official include parameters from documentation
            includes = [
                "charges", "payments", "discount", "products", "products.taxes",
                "charges.taxes", "products.product", "products.options", "combos.products",
                "charges.charge", "products.discount", "combos.discount",
                "combos.products.options.taxes", "combos.products.taxes", "products.options.taxes"
            ]
            
            params = {
                "filter[status]": "4,5",  # Status 4: completed, Status 5: returned
                "include": ",".join(includes),
                "sort": "reference",
                "filter[reference_after]": reference_after,
                "per_page": 50  # API returns 50 orders per page
            }
            
            # Add date filters if provided
            if start_date:
                params["filter[created_at][gte]"] = start_date.isoformat()
            if end_date:
                params["filter[created_at][lte]"] = end_date.isoformat()
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                url = f"{self.base_url}/orders"
                logger.info(f"💰 DEBUG: Making orders request to: {url}")
                logger.info(f"💰 DEBUG: Request params: {params}")
                
                response = await client.get(url, headers=headers, params=params)
                logger.info(f"💰 DEBUG: Orders response status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"💰 DEBUG: Orders API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "details": response.text
                    }
                
                data = response.json()
                orders = data.get('data', [])
                meta = data.get('meta', {})
                
                logger.info(f"💰 DEBUG: Retrieved {len(orders)} orders")
                
                # Process orders for accounting purposes
                processed_orders = []
                total_sales = 0
                total_returns = 0
                
                for order in orders:
                    order_status = order.get('status')
                    order_total = float(order.get('total_price', 0))
                    
                    # Calculate net sales (completed - returned)
                    if order_status == 4:  # Completed
                        total_sales += order_total
                    elif order_status == 5:  # Returned
                        total_returns += order_total
                    
                    # Extract key accounting information
                    processed_order = {
                        "id": order.get("id"),
                        "reference": order.get("reference"),
                        "status": order_status,
                        "status_name": "completed" if order_status == 4 else "returned" if order_status == 5 else "other",
                        "total_price": order_total,
                        "subtotal_price": float(order.get("subtotal_price", 0)),
                        "discount_amount": float(order.get("discount_amount", 0)),
                        "rounding_amount": float(order.get("rounding_amount", 0)),
                        "created_at": order.get("created_at"),
                        "business_date": order.get("business_date"),
                        
                        # Extract charges, taxes, payments info
                        "charges": self._extract_charges_info(order.get("charges", [])),
                        "taxes": self._extract_taxes_info(order),
                        "payments": self._extract_payments_info(order.get("payments", [])),
                        "products": self._extract_products_info(order.get("products", [])),
                        "combos": self._extract_combos_info(order.get("combos", []))
                    }
                    processed_orders.append(processed_order)
                
                return {
                    "success": True,
                    "orders": processed_orders,
                    "summary": {
                        "total_orders": len(orders),
                        "total_sales": total_sales,
                        "total_returns": total_returns,
                        "net_sales": total_sales - total_returns
                    },
                    "pagination": {
                        "current_page": meta.get("current_page", 1),
                        "last_page": meta.get("last_page", 1),
                        "per_page": meta.get("per_page", 50),
                        "total": meta.get("total", 0)
                    }
                }
                
        except Exception as e:
            logger.error(f"💰 DEBUG: Exception getting orders: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_charges_info(self, charges: List[Dict]) -> List[Dict]:
        """Extract charge information for accounting"""
        charge_info = []
        for charge in charges:
            charge_data = charge.get("charge", {})
            charge_info.append({
                "name": charge_data.get("name", ""),
                "amount": float(charge.get("amount", 0)),
                "tax_exclusive_amount": float(charge.get("tax_exclusive_amount", 0)),
                "value": charge_data.get("value", 0),
                "type": charge_data.get("type", 1),
                "taxes": [
                    {
                        "name": tax.get("name", ""),
                        "rate": tax.get("rate", 0),
                        "amount": float(tax.get("pivot", {}).get("amount", 0))
                    }
                    for tax in charge.get("taxes", [])
                ]
            })
        return charge_info
    
    def _extract_taxes_info(self, order: Dict) -> List[Dict]:
        """Extract comprehensive tax information from order"""
        taxes = []
        
        # Extract taxes from different sources as per documentation
        for product in order.get("products", []):
            for tax in product.get("taxes", []):
                taxes.append({
                    "source": "product",
                    "product_name": product.get("product", {}).get("name", ""),
                    "tax_name": tax.get("name", ""),
                    "rate": tax.get("rate", 0),
                    "amount": float(tax.get("pivot", {}).get("amount", 0))
                })
            
            # Product option taxes
            for option in product.get("options", []):
                for tax in option.get("taxes", []):
                    taxes.append({
                        "source": "product_option",
                        "product_name": product.get("product", {}).get("name", ""),
                        "tax_name": tax.get("name", ""),
                        "rate": tax.get("rate", 0),
                        "amount": float(tax.get("pivot", {}).get("amount", 0))
                    })
        
        return taxes
    
    def _extract_payments_info(self, payments: List[Dict]) -> List[Dict]:
        """Extract payment information for accounting"""
        payment_info = []
        for payment in payments:
            payment_info.append({
                "amount": float(payment.get("amount", 0)),
                "tendered": float(payment.get("tendered", 0)),
                "tips": float(payment.get("tips", 0)),
                "business_date": payment.get("business_date"),
                "added_at": payment.get("added_at"),
                "payment_method": payment.get("payment_method", {}).get("name", "Unknown")
            })
        return payment_info
    
    def _extract_products_info(self, products: List[Dict]) -> List[Dict]:
        """Extract product information for accounting"""
        product_info = []
        for product in products:
            product_data = product.get("product", {})
            discount = product.get("discount", {})
            
            product_info.append({
                "name": product_data.get("name", ""),
                "sku": product_data.get("sku", ""),
                "price": float(product_data.get("price", 0)),
                "quantity": product.get("quantity", 1),
                "total_price": float(product.get("total_price", 0)),
                "discount_amount": float(discount.get("amount", 0)) if discount else 0,
                "is_non_revenue": product_data.get("is_non_revenue", False)
            })
        return product_info
    
    def _extract_combos_info(self, combos: List[Dict]) -> List[Dict]:
        """Extract combo information for accounting"""
        combo_info = []
        for combo in combos:
            combo_info.append({
                "name": combo.get("name", ""),
                "quantity": combo.get("quantity", 1),
                "total_price": float(combo.get("total_price", 0)),
                "products": self._extract_products_info(combo.get("products", []))
            })
        return combo_info
    
    async def get_inventory_items(self, token: str) -> Dict[str, Any]:
        """
        Official inventory items endpoint for Accounting/ERP integration
        Raw and/or produced items tracked through inventory transactions
        """
        logger.info("📦 DEBUG: Fetching inventory items")
        try:
            headers = self._get_headers(token)
            all_items = []
            page = 1
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                while True:
                    url = f"{self.base_url}/inventory_items"
                    params = {"page": page, "per_page": 100}
                    
                    response = await client.get(url, headers=headers, params=params)
                    
                    if response.status_code != 200:
                        return {
                            "success": False,
                            "error": f"HTTP {response.status_code}",
                            "details": response.text
                        }
                    
                    data = response.json()
                    page_items = data.get("data", [])
                    all_items.extend(page_items)
                    
                    # Check pagination
                    meta = data.get("meta", {})
                    if meta.get("current_page", 1) >= meta.get("last_page", 1):
                        break
                    page += 1
            
            return {
                "success": True,
                "inventory_items": all_items,
                "total": len(all_items)
            }
            
        except Exception as e:
            logger.error(f"📦 DEBUG: Exception getting inventory items: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_suppliers(self, token: str) -> Dict[str, Any]:
        """
        Official suppliers endpoint for Accounting/ERP integration
        """
        logger.info("🏭 DEBUG: Fetching suppliers")
        try:
            headers = self._get_headers(token)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/suppliers"
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "details": response.text
                    }
                
                data = response.json()
                return {
                    "success": True,
                    "suppliers": data.get("data", []),
                    "total": len(data.get("data", []))
                }
                
        except Exception as e:
            logger.error(f"🏭 DEBUG: Exception getting suppliers: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_active_token(self, db: Session = None) -> Optional[str]:
        """Get active API token from database using SQLAlchemy session"""
        logger.info("🔑 DEBUG: Getting active token from database")
        try:
            # If no db session provided, we can't fetch from database
            if db is None:
                # Try to get a session using the project's get_db function
                try:
                    from database import get_db
                    db = next(get_db())
                    should_close = True
                except Exception as e:
                    logger.error(f"🔑 DEBUG: Could not get database session: {e}")
                    return None
            else:
                should_close = False
            
            # Query using SQLAlchemy session pattern
            result = db.execute(text("""
                SELECT api_token 
                FROM foodics_tokens 
                WHERE is_active = TRUE 
                ORDER BY created_at DESC 
                LIMIT 1
            """)).fetchone()
            
            if should_close:
                db.close()
            
            if result:
                logger.info("🔑 DEBUG: Found active token in database")
                return result[0]  # SQLAlchemy result tuple access
            else:
                logger.warning("🔑 DEBUG: No active token found in database")
                return None
                    
        except Exception as e:
            logger.error(f"🔑 DEBUG: Error getting active token: {str(e)}")
            return None

# Global service instance
foodics_service = FoodicsService()

# Backward compatibility wrapper
class SecureFoodicsService:
    """Secure wrapper for backward compatibility"""
    
    def __init__(self, db: Session = None):
        self.service = foodics_service
        self.db = db
        # Encryption support
        from config import settings
        self.cipher = settings.fernet_cipher
    
    def _encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data like API tokens"""
        if not data:
            return ""
        return self.cipher.encrypt(data.encode()).decode()
    
    def _decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if not encrypted_data:
            return ""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    async def store_credentials(self, api_token: str, configured_by: str) -> str:
        """
        Store encrypted API credentials in database
        """
        try:
            logger.info(f"🔐 Storing credentials for user: {configured_by}")
            
            # Deactivate any existing tokens
            self.db.execute(text("""
                UPDATE foodics_tokens SET is_active = FALSE WHERE is_active = TRUE
            """))
            
            # Encrypt and store the new token
            encrypted_token = self._encrypt_sensitive_data(api_token)
            
            self.db.execute(text("""
                INSERT INTO foodics_tokens (api_token, configured_by, is_active, created_at)
                VALUES (:token, :configured_by, TRUE, NOW())
            """), {
                'token': encrypted_token,
                'configured_by': configured_by
            })
            
            self.db.commit()
            logger.info(f"✅ Foodics credentials stored successfully for user: {configured_by}")
            return "success"
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Failed to store credentials: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to store credentials")
    
    async def get_configuration_status(self) -> Dict:
        """Get current configuration status"""
        try:
            result = self.db.execute(text("""
                SELECT COUNT(*) as total, 
                       MAX(created_at) as last_configured,
                       MAX(updated_at) as last_updated
                FROM foodics_tokens 
                WHERE is_active = TRUE
            """)).fetchone()
            
            if result and result[0] > 0:
                return {
                    "configured": True,
                    "api_token_configured": True,
                    "service_available": True,
                    "mode": "secure",
                    "last_configured": result[1].isoformat() if result[1] else None,
                    "last_updated": result[2].isoformat() if result[2] else None
                }
            else:
                return {
                    "configured": False,
                    "api_token_configured": False,
                    "service_available": False,
                    "mode": "secure"
                }
                
        except Exception as e:
            logger.error(f"❌ Failed to get configuration status: {str(e)}")
            return {
                "configured": False,
                "api_token_configured": False,
                "service_available": False,
                "mode": "secure",
                "error": str(e)
            }
    
    async def get_active_token(self) -> Optional[str]:
        """Get the currently active decrypted API token"""
        try:
            result = self.db.execute(text("""
                SELECT api_token FROM foodics_tokens 
                WHERE is_active = TRUE 
                ORDER BY created_at DESC 
                LIMIT 1
            """)).fetchone()
            
            if result:
                return self._decrypt_sensitive_data(result[0])
            return None
            
        except Exception as e:
            logger.error(f"❌ Failed to get active token: {str(e)}")
            return None
    
    async def test_connection(self) -> Dict:
        """Test connection using official whoami endpoint"""
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        # Use official whoami endpoint
        whoami_result = await self.service.get_whoami(token)
        if whoami_result.get("success"):
            # Also get settings
            settings_result = await self.service.get_settings(token)
            
            return {
                "success": True,
                "message": "Connection successful - Official ERP Integration",
                "business_info": whoami_result.get("business_info", {}),
                "business_settings": settings_result.get("settings", {}) if settings_result.get("success") else {},
                "recommended_scopes": self.service.recommended_scopes
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Connection failed: {whoami_result.get('error')}"
            )
    
    async def get_branches(self) -> List[Dict]:
        """Get available branches using official ERP integration"""
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            result = await self.service.get_branches(token)
            if result.get("success"):
                return result.get("branches", [])
            else:
                raise HTTPException(status_code=400, detail=f"Failed to fetch branches: {result.get('error')}")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to get branches: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch branches")
    
    async def get_accounting_orders(self, start_date: datetime = None, end_date: datetime = None, reference_after: int = 0) -> Dict:
        """Get orders for accounting using official ERP integration"""
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            return await self.service.get_orders_for_accounting(token, start_date, end_date, reference_after)
                
        except Exception as e:
            logger.error(f"❌ Failed to get accounting orders: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_inventory_data(self) -> Dict:
        """Get comprehensive inventory data for ERP integration"""
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            # Get inventory items and suppliers
            items_result = await self.service.get_inventory_items(token)
            suppliers_result = await self.service.get_suppliers(token)
            
            return {
                "success": True,
                "inventory_items": items_result.get("inventory_items", []) if items_result.get("success") else [],
                "suppliers": suppliers_result.get("suppliers", []) if suppliers_result.get("success") else [],
                "items_count": items_result.get("total", 0) if items_result.get("success") else 0,
                "suppliers_count": suppliers_result.get("total", 0) if suppliers_result.get("success") else 0
            }
                
        except Exception as e:
            logger.error(f"❌ Failed to get inventory data: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def store_branch_configuration(self, branch_id: str, branch_name: str) -> Dict:
        """Store configuration for direct branch integration"""
        try:
            # Store branch configuration
            self.db.execute(text("""
                INSERT INTO api_configurations (config_key, config_value, config_type, description)
                VALUES ('foodics_default_branch_id', :branch_id, 'string', 'Default Foodics branch for direct integration')
                ON DUPLICATE KEY UPDATE config_value = :branch_id, updated_at = NOW()
            """), {'branch_id': branch_id})
            
            self.db.execute(text("""
                INSERT INTO api_configurations (config_key, config_value, config_type, description)
                VALUES ('foodics_default_branch_name', :branch_name, 'string', 'Default Foodics branch name')
                ON DUPLICATE KEY UPDATE config_value = :branch_name, updated_at = NOW()
            """), {'branch_name': branch_name})
            
            self.db.commit()
            
            return {
                "success": True,
                "message": f"Branch configuration saved for {branch_name} (ID: {branch_id})"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Failed to store branch configuration: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to store branch configuration")
    
    async def get_default_branch_id(self) -> Optional[str]:
        """Get the configured default branch ID"""
        try:
            result = self.db.execute(text("""
                SELECT config_value FROM api_configurations 
                WHERE config_key = 'foodics_default_branch_id'
            """)).fetchone()
            
            return result[0] if result else None
            
        except Exception as e:
            logger.error(f"❌ Failed to get default branch ID: {str(e)}")
            return None
    
    async def remove_configuration(self):
        """Remove all Foodics configuration"""
        try:
            self.db.execute(text("""
                UPDATE foodics_tokens SET is_active = FALSE WHERE is_active = TRUE
            """))
            
            # Also remove branch configuration
            self.db.execute(text("""
                DELETE FROM api_configurations 
                WHERE config_key IN ('foodics_default_branch_id', 'foodics_default_branch_name')
            """))
            
            self.db.commit()
            logger.info("✅ Foodics configuration removed successfully")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Failed to remove configuration: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to remove configuration")
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify token using official verification"""
        return await self.service.verify_token(token)

# Global secure service instance for backward compatibility
secure_foodics_service = SecureFoodicsService() 