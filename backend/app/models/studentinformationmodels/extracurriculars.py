from sqlalchemy import Column, Integer, String, relationship, ForeignKey
from backend.app.core.database import Base

class Extracurricular(Base):
    __tablename__ = 'Extracurriculars'

    extracurricularID = Column('ExtracurricularID', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    activityName = Column('ActivityName', String(255))
    activityDescription = Column('ActivityDescription', String(255))
    weeklyHourCommitment = Column('WeeklyHourCommitment', Integer)

    student = relationship('Student')