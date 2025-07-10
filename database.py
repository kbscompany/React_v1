from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from urllib.parse import quote_plus
from config import settings

# --- MySQL Database Configuration ---
DB_HOST = settings.db_host
DB_PORT = settings.db_port
DB_USER = settings.db_user
DB_PASSWORD = settings.db_password
DB_NAME = settings.db_name

# Check if we have database password
if not DB_PASSWORD:
    print("⚠️  No MySQL password provided in .env file")
    print("💡 Please set DB_PASSWORD in your .env file")
    print("🔧 Example: DB_PASSWORD=your_mysql_password_here")
    # Don't raise error, let it try to connect anyway (might work without password)

# URL-encode the password to handle special characters
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

# Create MySQL connection URL
if DB_PASSWORD:
    SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"🔗 Connecting to MySQL: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

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

# Test database connection
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"✅ MySQL connected successfully: {DB_NAME} on {DB_HOST}:{DB_PORT}")
    if settings.debug:
        print(f"🔍 Connection URL: mysql+mysqlconnector://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
except Exception as e:
    print(f"❌ MySQL connection failed: {e}")
    print("💡 Please check:")
    print("   - MySQL is running on your EC2 server")
    print("   - Database credentials in .env file are correct")
    print("   - Database 'bakery_react' exists")
    print("   - Python MySQL connector is installed: pip install mysql-connector-python")
    raise
