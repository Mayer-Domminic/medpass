from sqlalchemy import Column, Integer, Boolean, relationship, ForeignKey
from backend.app.core.database import Base

class ExamResults(Base):
    __tablename__ = 'ExamResults'

    examResultsID = Column('ExamResultsID', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    examID = Column('ExamID', Integer, ForeignKey('exam.ExamID'))
    clerkshipID = Column('ClerkshipID', Integer, ForeignKey('clerkship.ClerkshipID'))
    score = Column('Score', Integer, nullable=False)
    passOrFail = Column('PassOrFail', Boolean)

    student = relationship('Student')
    exam = relationship('Exam')
    clerkship = relationship('Clerkship')