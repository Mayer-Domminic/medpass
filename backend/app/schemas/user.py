from pydantic import BaseModel, EmailStr, StringConstraints
from typing import Optional, Annotated
from datetime import datetime

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    issuperuser: bool

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    isactive: bool = True
    issuperuser: bool = False

class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(min_length=8)]

class UserInDB(UserBase):
    hashed_password: str

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    class Config:
        from_attributes = True