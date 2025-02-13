from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....models.user import User
from ....models.studenttemp import StudentTemp
from ....schemas.student import StudentResponse

router = APIRouter()

@router.get("/info", response_model=StudentResponse)
async def get_student_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get student information for the currently authenticated user.
    Ensures users can only access their own student data.
    """

    student = db.query(StudentTemp).filter(StudentTemp.net_id == current_user.net_id).first()
    if not student:
        print(f"ERROR: No student record found for net_id: {current_user.net_id}")
        raise HTTPException(
            status_code=404,
            detail=f"No student record found for user {current_user.net_id}"
        )
    return student


@router.get("/{net_id}", response_model=StudentResponse)
async def get_student_by_id(
    net_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get student information by net_id.
    This endpoint ensures users can only access their own student data,
    while superusers can access any student's data.
    """
    # Check if user is requesting their own data or is a superuser
    # Important if student A passes in student B's netid, it will not work!
    # TODO , this may not work as i'm using AND (TEST LATER)
    if net_id != current_user.net_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this student's information"
        )

    student = db.query(StudentTemp).filter(StudentTemp.net_id == net_id).first()
    
    if not student:
        # Try case-insensitive search as fallback
        student = db.query(StudentTemp).filter(StudentTemp.net_id.ilike(f"%{net_id}%")).first()
        
        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student not found with net_id {net_id}"
            )
    
    return student