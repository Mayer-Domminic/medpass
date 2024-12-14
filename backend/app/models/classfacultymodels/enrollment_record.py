from sqlalchemy import Column, Integer, Float, Boolean, relationship, ForeignKey
from backend.app.core.database import Base

class EnrollmentRecord(Base):
    __tablename__ = 'EnrollmentRecord'

    enrollmentRecordID = Column('EnrollmentRecord', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    classOfferingID = Column('ClassOfferingID', Integer, ForeignKey('classoffering.ClassOfferingID'))
    gradePercentage = Column('GradePercentage', Float)
    passFailStatus = Column('PassFailStatus', Boolean)
    attendancePercentage = Column('AttendancePercentage', Float)

    student = relationship('Student')
    classOffering = relationship('ClassOffering')
