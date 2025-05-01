from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Optional, Annotated

class UserUpdateRequest(BaseModel):
    # optional because we don't want to require all fields be updated
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[Annotated[str, StringConstraints(min_length=8)]] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    position: Optional[str] = None  #note: faculty only
    bio: Optional[str] = None 

class UserUpdateResponse(BaseModel):
    username: str
    email: str
    firstname: str
    lastname: str
    position: Optional[str] = None  # note: faculty only
    is_student: bool
    is_faculty: bool
    bio: Optional[str] = None
    message: str

    class Config:
        from_attributes = True