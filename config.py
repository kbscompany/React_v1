import os
from datetime import timedelta
from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet
import base64
import hashlib
import secrets

class Settings(BaseSettings):
    # === CRITICAL: No weak defaults for production ===
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database settings (no defaults for security)
    db_host: str = "localhost"
    db_port: str = "3306"
    db_user: str = "root"
    db_password: str
    db_name: str = "bakery_react"
    
    # Optional admin user bootstrap password (used by initial migration scripts)
    admin_password: str | None = None
    
    # Application settings
    debug: bool = False
    environment: str = "development"
    log_level: str = "INFO"
    
    # File upload settings
    max_upload_size_mb: int = 10
    allowed_file_extensions: str = "pdf,jpg,jpeg,png,doc,docx,xls,xlsx"
    
    # CORS settings
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Encryption key for sensitive data (derived from SECRET_KEY)
    @property
    def encryption_key(self) -> bytes:
        """Generate encryption key from SECRET_KEY for sensitive data encryption"""
        if not self.secret_key:
            raise ValueError("SECRET_KEY required for encryption")
        key_material = hashlib.sha256(self.secret_key.encode()).digest()
        return base64.urlsafe_b64encode(key_material)
    
    @property
    def fernet_cipher(self) -> Fernet:
        """Get Fernet cipher instance for encryption/decryption"""
        return Fernet(self.encryption_key)
    
    # Foodics security settings
    foodics_token_expiry_hours: int = 24
    max_failed_sync_attempts: int = 3
    sync_rate_limit_per_hour: int = 10
    
    @property
    def cors_origins(self) -> list:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  # Allow extra fields in environment variables

# Utility function to generate secure secret key
def generate_secret_key(length: int = 64) -> str:
    """Generate a cryptographically secure secret key"""
    return secrets.token_urlsafe(length)

# Create a global settings instance
try:
    settings = Settings()
    # Validate database password in production
    if settings.environment == "production" and not settings.db_password:
        raise ValueError("DB_PASSWORD environment variable must be set for production")
except Exception as e:
    print(f"⚠️  Configuration Error: {e}")
    print("💡 Make sure to create a .env file with all required settings")
    print("📝 Use .env.example as a template")
    raise 