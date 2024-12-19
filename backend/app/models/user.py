from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from ..core.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True) 
    full_name = Column(String, nullable=True)
    net_id = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)

    def __repr__(self):
        return f"<User {self.auth0_id}>"