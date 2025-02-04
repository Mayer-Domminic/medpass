from typing import List
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# DB imports
from ....schemas import user as user_schemas
from ...deps import get_db, get_current_user, get_current_user_token
from ....models import user as user_models
from ....models import classfacultymodels as faculty_models
from ....models import studentinformationmodels as student_models

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=user_schemas.User)
async def create_or_update_user(
    user: user_schemas.UserCreate,
    token: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Creating/Updating user with auth0_id: {user.auth0_id}")
        
        # Verify the auth0_id matches the token
        if user.auth0_id != token.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Auth0 ID mismatch"
            )

        # Try to find existing user
        db_user = db.query(user_models.User).filter(
            user_models.User.auth0_id == user.auth0_id
        ).first()

        if db_user:
            # Update existing user
            logger.info(f"Updating existing user: {db_user.auth0_id}")
            for field, value in user.dict(exclude_unset=True).items():
                setattr(db_user, field, value)
        else:
            # Create new user
            logger.info("Creating new user")
            db_user = user_models.User(**user.dict())
            db.add(db_user)

        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating/updating user: {str(e)}"
        )

@router.get("/me", response_model=user_schemas.User)
async def read_user_me(
    current_user: user_models.User = Depends(get_current_user)
):
    return current_user

@router.get("/", response_model=List[user_schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    users = db.query(user_models.User).offset(skip).limit(limit).all()
    return users

@router.post("/verify-netid")
async def verify_netid(
    netid_data: user_schemas.NetIDVerify,
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Attempting to verify NetID: {netid_data.net_id}")

        # Basic validation
        if not netid_data.net_id or len(netid_data.net_id) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid NetID format"
            )

        try:
            # Check if NetID already exists on a different user
            existing_user = db.query(user_models.User).filter(
                user_models.User.net_id == netid_data.net_id,
                user_models.User.id != current_user.id
            ).first()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="NetID already registered"
                )

            # Update current user's NetID
            current_user.net_id = netid_data.net_id
            db.commit()
            
            logger.info("Successfully verified and updated NetID")
            return {"message": "NetID verified successfully"}
            
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(db_error)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying NetID: {str(e)}"
        )

@router.get("/by-netid/{net_id}", response_model=Dict[str, Any])
async def get_user_data_by_netid(
    net_id: str,
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all data associated with a NetID, including:
    - User profile
    - Student information (if exists)
    - Faculty information (if exists)
    - Class enrollments
    - Exam results
    - Grades
    """
    # Security check - users can only access their own data unless they're superusers
    if current_user.net_id != net_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this data"
        )
    
    try:
        user = db.query(user_models.User).filter(
            user_models.User.net_id == net_id
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        user_data = {
            "profile": {
                "net_id": user.net_id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active
            },
            "student_info": None,
            "faculty_info": None,
            "enrollments": [],
            "exam_results": [],
            "grades": []
        }
        
        student = db.query(student_models.Student).filter(
            student_models.Student.user_id == user.net_id
        ).first()
        
        if student:
            user_data["student_info"] = {
                "student_id": student.studentID,
                "extracurriculars": [
                    {
                        "name": e.activityName,
                        "description": e.activityDescription,
                        "hours": e.weeklyHourCommitment
                    }
                    for e in student.extracurricular
                ],
                "clerkships": [
                    {
                        "name": c.clerkshipName,
                        "company": c.company,
                        "start_date": c.startDate,
                        "end_date": c.endDate
                    }
                    for c in student.clerkshipStudent
                ]
            }
            
            user_data["enrollments"] = [
                {
                    "class_name": er.offering.classInfo.className,
                    "semester": er.offering.semester,
                    "grade": er.gradePercentage,
                    "attendance": er.attendancePercentage,
                    "status": "Pass" if er.passFailStatus else "Fail"
                }
                for er in student.enrollmentRecord
            ]
            
            user_data["exam_results"] = [
                {
                    "exam_name": er.exam.examName,
                    "score": er.score,
                    "status": "Pass" if er.passOrFail else "Fail",
                    "date": er.clerkship.startDate if er.clerkship else None
                }
                for er in student.examResults
            ]
        
        # Get faculty information if exists
        faculty = db.query(faculty_models.Faculty).filter(
            faculty_models.Faculty.user_id == user.net_id
        ).first()
        
        if faculty:
            user_data["faculty_info"] = {
                "faculty_id": faculty.facultyID,
                "position": faculty.position,
                "classes": [
                    {
                        "class_name": co.classInfo.className,
                        "semester": co.semester,
                        "date_taught": co.dateTaught
                    }
                    for co in faculty.offering
                ]
            }
            
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user data: {str(e)}"
        )

