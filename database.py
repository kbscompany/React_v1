from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from urllib.parse import quote_plus
from config import settings

# --- Secure MySQL configuration (no hardcoded passwords) ---
DB_HOST = settings.db_host
DB_PORT = settings.db_port
DB_USER = settings.db_user
DB_PASSWORD = settings.db_password
DB_NAME = settings.db_name

# Validate critical settings
if not DB_PASSWORD and settings.environment == "production":
    raise ValueError("❌ Database password not configured. Set DB_PASSWORD environment variable.")

# URL-encode the password to handle special characters
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- SQLAlchemy Engine & Session ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=settings.debug,  # Only echo in debug mode
    pool_pre_ping=True,   # Verify connections before use
    pool_recycle=3600,    # Recycle connections every hour
    pool_size=10,         # Connection pool size
    max_overflow=20       # Max overflow connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Connection validation
try:
    # Test database connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"✅ Database connected: {DB_NAME} on {DB_HOST}:{DB_PORT}")
    if settings.debug:
        print(f"🔍 Database URL: mysql+mysqlconnector://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("💡 Check your database configuration and credentials")
    raise
