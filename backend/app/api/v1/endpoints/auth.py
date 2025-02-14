from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from ....core.database import get_db
from ....core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ....schemas.user import UserLogin, Token, UserCreate, UserResponse
from ....models.studentinformationmodels import LoginInfo as User
from datetime import timedelta

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect netID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.isactive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect netID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "issuperuser": bool(user.issuperuser),
        }
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=400,
            detail="User with this netID already exists"
        )
    # TODO handle registers
    user = User(
        username=user_in.username,
        email=user_in.email,
        password=get_password_hash(user_in.password),
        isactive=True,
        issuperuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/details", response_model=UserResponse)
async def get_user_details(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get details for the currently authenticated user.
    """
    user = db.query(User).filter(User.username == current_user.username).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user

