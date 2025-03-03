from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....core.security import get_current_active_user, get_password_hash
from ....core.database import get_db
from app.models import LoginInfo as User
from app.models import Student, Faculty
from app.schemas.settings import UserUpdateRequest, UserUpdateResponse

router = APIRouter()

def get_user_type(db: Session, current_user: User):
    """
    helper function to determine user type, returns user type
    
    args:
        db (Session): Database session
        current_user (User): User object
    
    """
    student = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
    faculty = db.query(Faculty).filter(Faculty.logininfoid == current_user.logininfoid).first()

    return {
        "is_student": student is not None,
        "is_faculty": faculty is not None,
        "student": student,
        "faculty": faculty,
        "user_type": "student" if student else "faculty" if faculty else None
    }

def update_user_profile(db: Session, current_user: User, student: Student = None, faculty: Faculty = None, username: str = None, email: str = None, password: str = None, firstname: str = None, lastname: str = None, position: str = None):
    """
    helper function that takes validated user object and updates profile, returns dict of updated user info
    
    args:
        db (Session): Database session
        current_user (User): Current authenticated user
        student (Student, optional): Student object if user is a student
        faculty (Faculty, optional): Faculty object if user is faculty
        username (str, optional): New username
        email (str, optional): New email
        password (str, optional): New password
        firstname (str, optional): New first name
        lastname (str, optional): New last name
        position (str, optional): New position (faculty only)
    
    """

    #logininfo fields
    if username:
        current_user.username = username
    if email:
        current_user.email = email
    if password:
        current_user.password = get_password_hash(password)
    
    #student fields
    if student and (firstname or lastname):
        if firstname:
            student.firstname = firstname
        if lastname:
            student.lastname = lastname
    
    #faculty fields
    if faculty:
        if firstname:
            faculty.firstname = firstname
        if lastname:
            faculty.lastname = lastname
        if position:
            faculty.position = position

    db.commit()
    db.refresh(current_user)
    if student:
        db.refresh(student)
    if faculty:
        db.refresh(faculty)
    
    response = {
        "username": current_user.username,
        "email": current_user.email,
        "firstname": "",
        "lastname": "",
        "position": None,
        "is_student": student is not None,
        "is_faculty": faculty is not None,
        "message": "User information updated successfully"
    }

    if student:
        response["firstname"] = student.firstname
        response["lastname"] = student.lastname
    else:  # must be faculty if not student
        response["firstname"] = faculty.firstname
        response["lastname"] = faculty.lastname
        response["position"] = faculty.position

    return response

    

@router.patch("/update", response_model=UserUpdateResponse)
async def update_user_settings(
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    determines user type (student, faculty, or none), updates profile of authenticated user, returns updated user info
    """
    try:
        # gets user type
        user_info = get_user_type(db, current_user)
        student = user_info["student"]
        faculty = user_info["faculty"]
        user_type = user_info["user_type"]
        
        # ensures user exists in exactly one role
        if not user_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # validates 'position' field is only used for faculty
        if user_data.position and user_type != "faculty":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Position can only be updated for faculty members"
            )
        
        # updates user profile based on user type
        updated_user = update_user_profile(
            db=db,
            current_user=current_user,
            student=student if user_type == "student" else None,
            faculty=faculty if user_type == "faculty" else None,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            firstname=user_data.firstname,
            lastname=user_data.lastname,
            position=user_data.position if user_type == "faculty" else None
        )
        
        return updated_user
    
    except HTTPException as http_ex:
        # re-raise HTTP exceptions directly
        raise http_ex
    except Exception as e:
        print(f"Update user settings error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )