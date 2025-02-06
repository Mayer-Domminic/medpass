
from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Optional, Annotated
from datetime import datetime
from .student import StudentResponse

class UserBase(BaseModel):
    net_id: Annotated[str, StringConstraints(max_length=50, min_length=3)]
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Annotated[str, StringConstraints(min_length=8)] = None

class UserInDBBase(UserBase):
    created_at: datetime
    updated_at: datetime
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True

class UserInDB(UserInDBBase):
    hashed_password: str

class UserResponse(UserInDBBase):
    pass