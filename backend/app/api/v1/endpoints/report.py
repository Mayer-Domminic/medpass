from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_current_active_user
)
from app.models import LoginInfo as User
from app.models import (
    Student,
)
router = APIRouter()

@router.get("/report")
async def login(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        print(current_user.username)
        if current_user.issuperuser:
            raise HTTPException(
                status_code=400,
                detail="You can't be an admin, you must be a student."
            )

        sid = current_user.username
        stud = db.query(User).filter(User.username == current_user.username).first()
        
        print(stud)
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )