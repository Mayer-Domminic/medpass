# Rino David

from sqlalchemy import Column, Integer, String, relationship
from backend.app.core.database import Base

class Exam(Base):
    __tablename__ = "Exam"

    examID = Column('ExamID', Integer, primary_key=True, index=True)
    examName = Column('ExamName', String(255), nullable=False),
    examDescription = Column('ExamDescription', String(255))

    question = relationship('Question', back_populates='exam')

