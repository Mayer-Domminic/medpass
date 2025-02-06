from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from ....api.deps import get_current_user, get_db
from ....models import User, Student
from ....schemas.user import UserUpdate, UserResponse
from ....schemas.student import StudentCreate, StudentResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user with student data if available"""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user"""
    for field, value in user_in.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/debug/all", response_model=None)
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Debug endpoint to list all users in database
    """
    users = db.query(User).all()
    print(f"\nTotal users in database: {len(users)}")
    print("\nAll users:")
    for u in users:
        print(f"net_id: {u.net_id}, email: {u.email}")
    
    return {"total_users": len(users)}