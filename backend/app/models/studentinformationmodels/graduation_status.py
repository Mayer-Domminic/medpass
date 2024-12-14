from sqlalchemy import Column, Integer, Boolean, Date, String, relationship, ForeignKey
from backend.app.core.database import Base

class GraduationStatus(Base):
    __tablename__ = 'GraduationStatus'

    graduationStatusID = Column('GraduationStatusID', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    classRosterID = Column('ClassRosterID', Integer, ForeignKey('classroster.ClassRosterID'))
    graduationYear = Column('GraduationYear', Date)
    graduated = Column('Graduated', Boolean)
    graduationLength = Column('GraduationLength', Integer)
    status = Column('Status', String(255))

    student = relationship('Student')
    classRoster = relationship('ClassRoster')
