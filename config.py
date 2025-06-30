import os
from datetime import timedelta
from pydantic_settings import BaseSettings
from cryptography.fernet import Fernet
import base64
import hashlib
import secrets

class Settings(BaseSettings):
    # === CRITICAL: No weak defaults for production ===
    secret_key: str = os.getenv("SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Security validation
    def __post_init__(self):
        if not self.secret_key:
            raise ValueError("SECRET_KEY environment variable must be set for production")
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
    
    # Database settings (no defaults for security)
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: str = os.getenv("DB_PORT", "3306")
    db_user: str = os.getenv("DB_USER", "root")
    db_password: str = os.getenv("DB_PASSWORD")
    db_name: str = os.getenv("DB_NAME", "bakery_react")
    
    # Optional admin user bootstrap password (used by initial migration scripts)
    admin_password: str | None = os.getenv("ADMIN_PASSWORD")
    
    # Application settings
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # File upload settings
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    allowed_file_extensions: str = os.getenv("ALLOWED_FILE_EXTENSIONS", "pdf,jpg,jpeg,png,doc,docx,xls,xlsx")
    
    # CORS settings
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
    
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
    foodics_token_expiry_hours: int = int(os.getenv("FOODICS_TOKEN_EXPIRY_HOURS", "24"))
    max_failed_sync_attempts: int = int(os.getenv("MAX_FAILED_SYNC_ATTEMPTS", "3"))
    sync_rate_limit_per_hour: int = int(os.getenv("SYNC_RATE_LIMIT_PER_HOUR", "10"))
    
    @property
    def cors_origins(self) -> list:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

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