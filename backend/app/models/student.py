from sqlalchemy import Column, Integer, Float, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base

class Student(Base):
    __tablename__ = "students"

    random_id = Column(String, primary_key=True)
    net_id = Column(String, ForeignKey("users.net_id"), unique=True)
    cum_total_gpa = Column(Float, nullable=True)
    cum_bcpm_gpa = Column(Float, nullable=True)
    drop_year = Column(Integer, nullable=True)
    grad_year = Column(Integer, nullable=True)
    graduated = Column(Boolean, default=False)
    
    # Relationship back to user
    user = relationship("User", back_populates="student")