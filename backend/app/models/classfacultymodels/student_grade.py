from sqlalchemy import Column, Integer, Float, Date, relationship, ForeignKey
from backend.app.core.database import Base

class StudentGrade(Base):
    __tablename__ = 'StudentGrade'

    studentGradeID = Column('StudentGradeID', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    gradeClassificationID = Column('GradeClassificationID', Integer, ForeignKey('gradeclassification.GradeClassificationID'))
    pointsEarned = Column('PointsEarned', Float)
    pointsAvailable = Column('PointsAvailable', Float)
    dateRecorded = Column('DateRecorded', Date)

    student = relationship('Student')
    gradeClassification = relationship('GradeClassification')