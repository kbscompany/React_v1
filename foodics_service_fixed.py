#!/usr/bin/env python3
"""
Foodics API Integration Service - Clean Version

This module handles all interactions with the Foodics API.
"""

import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import text
from config import settings

logger = logging.getLogger(__name__)

class SecureFoodicsService:
    """
    Secure Foodics API integration service with encrypted credential storage
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.base_url = "https://api.foodics.com/v5"
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
    
    async def verify_credentials(self, api_token: str) -> bool:
        """
        Verify API credentials by making a test API call
        """
        try:
            headers = {
                'Authorization': f'Bearer {api_token}',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/me", headers=headers)
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Credential verification failed: {str(e)}")
            return False
    
    async def store_credentials(self, api_token: str, configured_by: str) -> str:
        """
        Store encrypted API credentials
        """
        try:
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
            logger.info(f"Foodics credentials stored successfully for user: {configured_by}")
            return "success"
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to store credentials: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to store credentials")
    
    async def get_configuration_status(self) -> Dict:
        """
        Get current configuration status
        """
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
                    "mode": "basic",
                    "last_configured": result[1].isoformat() if result[1] else None,
                    "last_updated": result[2].isoformat() if result[2] else None
                }
            else:
                return {
                    "configured": False,
                    "api_token_configured": False,
                    "service_available": False,
                    "mode": "basic"
                }
                
        except Exception as e:
            logger.error(f"Failed to get configuration status: {str(e)}")
            return {
                "configured": False,
                "api_token_configured": False,
                "service_available": False,
                "mode": "basic",
                "error": str(e)
            }
    
    async def get_active_token(self) -> Optional[str]:
        """
        Get the currently active decrypted API token
        """
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
            logger.error(f"Failed to get active token: {str(e)}")
            return None
    
    async def test_connection(self) -> Dict:
        """
        Test the current API connection and return basic account info
        """
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get account info
                me_response = await client.get(f"{self.base_url}/me", headers=headers)
                if me_response.status_code != 200:
                    raise HTTPException(status_code=400, detail="Invalid API token")
                
                account_info = me_response.json().get('data', {})
                
                # Get branches
                branches_response = await client.get(f"{self.base_url}/branches", headers=headers)
                branches = []
                if branches_response.status_code == 200:
                    branches_data = branches_response.json().get('data', [])
                    branches = [
                        {
                            "id": branch.get('id'),
                            "name": branch.get('name', 'Unknown'),
                            "address": branch.get('address', ''),
                            "is_active": branch.get('is_active', True)
                        }
                        for branch in branches_data
                    ]
                
                return {
                    "success": True,
                    "message": "Connection successful",
                    "account_info": {
                        "name": account_info.get('name', 'Unknown'),
                        "email": account_info.get('email', ''),
                        "business_name": account_info.get('business', {}).get('name', 'Unknown Business')
                    },
                    "branches": branches
                }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Connection test failed")
    
    async def get_branches(self) -> List[Dict]:
        """
        Get available branches for the configured account
        """
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/branches", headers=headers)
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch branches: {response.status_code} - {response.text}")
                    raise HTTPException(status_code=400, detail="Failed to fetch branches")
                
                branches_data = response.json().get('data', [])
                return [
                    {
                        "id": branch.get('id'),
                        "name": branch.get('name', 'Unknown'),
                        "address": branch.get('address', ''),
                        "is_active": branch.get('is_active', True),
                        "phone": branch.get('phone', ''),
                        "timezone": branch.get('timezone', '')
                    }
                    for branch in branches_data
                ]
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get branches: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch branches")
    
    async def get_branch_sales(self, branch_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """
        Get comprehensive sales data for a specific branch
        """
        token = await self.get_active_token()
        if not token:
            raise HTTPException(status_code=400, detail="No active API token found")
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Get orders for the branch
                response = await client.get(
                    f"{self.base_url}/orders",
                    headers=headers,
                    params={
                        'branch_id': branch_id,
                        'created_at[gte]': start_date.isoformat(),
                        'created_at[lte]': end_date.isoformat(),
                        'per_page': 100,
                        'include': 'items,customer'
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch sales data: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": "Failed to fetch sales data from Foodics"
                    }
                
                data = response.json()
                orders = data.get('data', [])
                
                # Calculate sales metrics
                total_orders = len(orders)
                total_sales = sum(float(order.get('total', 0)) for order in orders)
                average_order = total_sales / total_orders if total_orders > 0 else 0
                
                return {
                    "success": True,
                    "data": {
                        "branch_id": branch_id,
                        "period": {
                            "start_date": start_date.isoformat(),
                            "end_date": end_date.isoformat()
                        },
                        "total_orders": total_orders,
                        "total_sales": total_sales,
                        "average_order": average_order,
                        "orders": orders[:10]  # Return first 10 orders as sample
                    }
                }
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get branch sales: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def store_branch_configuration(self, branch_id: str, branch_name: str) -> Dict:
        """
        Store configuration for direct branch integration
        """
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
            logger.error(f"Failed to store branch configuration: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to store branch configuration")
    
    async def get_default_branch_id(self) -> Optional[str]:
        """
        Get the configured default branch ID
        """
        try:
            result = self.db.execute(text("""
                SELECT config_value FROM api_configurations 
                WHERE config_key = 'foodics_default_branch_id'
            """)).fetchone()
            
            return result[0] if result else None
            
        except Exception as e:
            logger.error(f"Failed to get default branch ID: {str(e)}")
            return None

    async def remove_configuration(self):
        """
        Remove all Foodics configuration
        """
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
            logger.info("Foodics configuration removed successfully")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to remove configuration: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to remove configuration")

# Helper functions for API endpoints
async def get_foodics_service(db: Session) -> SecureFoodicsService:
    """Get Foodics service instance"""
    return SecureFoodicsService(db)

# Backward compatibility classes
class FoodicsService(SecureFoodicsService):
    """Backward compatibility alias"""
    pass 