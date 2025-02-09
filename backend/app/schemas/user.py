from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Optional, Annotated
from datetime import datetime

class UserLogin(BaseModel):
    net_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    net_id: Optional[str] = None

class UserBase(BaseModel):
    net_id: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]

class UserInDB(UserBase):
    hashed_password: str

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    class Config:
        from_attributes = True