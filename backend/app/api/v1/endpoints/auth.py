from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any, Optional
from ....core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash
)
from ....core.config import settings
from ....models import User
from ....schemas.user import UserCreate, UserResponse
from ....schemas.token import Token
from ....api.deps import get_db, get_current_user
from datetime import timedelta

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register new user.
    """
    user = db.query(User).filter(User.net_id == user_in.net_id).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this netID already exists."
        )
    user = User(
        net_id=user_in.net_id,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(
    *,
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login.
    """
    user = db.query(User).filter(User.net_id == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect netID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": user.net_id}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.net_id}, expires_delta=refresh_token_expires
    )
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=access_token_expires.total_seconds(),
        expires=access_token_expires.total_seconds(),
        secure=settings.ENVIRONMENT != "development",
        samesite="lax"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=refresh_token_expires.total_seconds(),
        expires=refresh_token_expires.total_seconds(),
        secure=settings.ENVIRONMENT != "development",
        samesite="lax"
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(
    *,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(None)
) -> Any:
    """
    Refresh access token.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
    
    try:
        user = get_current_user(db, refresh_token)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.net_id}, expires_delta=access_token_expires
        )
        
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=access_token_expires.total_seconds(),
            expires=access_token_expires.total_seconds(),
            secure=settings.ENVIRONMENT != "development",
            samesite="lax"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Logout user by clearing cookies.
    """
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Successfully logged out"}

