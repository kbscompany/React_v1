from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserRole
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    """Verify password using bcrypt only"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification failed: {e}")
        return False

def get_password_hash(password):
    """Generate bcrypt hash for passwords"""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate user with username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        print(f"User '{username}' not found")
        return False
    
    # Check if user is active
    if hasattr(user, 'is_active') and not user.is_active:
        print(f"User '{username}' is inactive")
        return False
    
    if not verify_password(password, user.password_hash):
        print(f"Password verification failed for user '{username}'")
        return False

    print(f"Authentication successful for user '{username}'")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str, db: Session) -> Optional[User]:
    """Verify JWT token and return user if valid"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        return None
    
    # Check if user is active
    if hasattr(user, 'is_active') and not user.is_active:
        return None
    
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user"""
    if hasattr(current_user, 'is_active') and not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def check_user_role(current_user: User = Depends(get_current_active_user), required_role: UserRole = None):
    if required_role and current_user.role != required_role and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Role constants
ROLE_ADMIN = 1
ROLE_WAREHOUSE_MANAGER = 2
ROLE_STAFF = 3

def is_warehouse_manager(current_user: User = Depends(get_current_active_user)):
    return current_user.role_id in [ROLE_ADMIN, ROLE_WAREHOUSE_MANAGER]
