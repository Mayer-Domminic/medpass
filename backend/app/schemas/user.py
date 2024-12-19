from pydantic import BaseModel, EmailStr
from typing import Optional

class NetIDVerify(BaseModel):
    net_id: str

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    net_id: Optional[str] = None

class UserCreate(UserBase):
    auth0_id: str

class User(UserBase):
    id: int
    auth0_id: str
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True