from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import schemas
import models
from database import engine, get_db
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash
)
from config import settings
import os
import uuid
import shutil
from pathlib import Path

# Create upload directories
UPLOAD_DIR = "uploads/expense_files"
EARLY_SETTLEMENT_UPLOAD_DIR = "uploads/early_settlement_files"
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(EARLY_SETTLEMENT_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Create tables
models.Base.metadata.create_all(bind=engine)

# Import warehouse endpoints router
import warehouse_endpoints

# Create FastAPI instance
app = FastAPI(title="Warehouse & Expense Management System")

# Include warehouse endpoints router
app.include_router(warehouse_endpoints.router)

# Mount static files for file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic endpoint to test server
@app.get("/")
async def root():
    return {"message": "FastAPI Server is running"}

@app.get("/test")
async def test():
    return {"status": "API is working"}

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role_id=user.role_id or 1
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Load user with role relationship
    user_with_role = db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == current_user.id).first()
    if not user_with_role:
        raise HTTPException(status_code=404, detail="User not found")
    return user_with_role 