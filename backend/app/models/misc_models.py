from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Identity
from sqlalchemy.orm import relationship
from app.core.base import Base


class ClassRoster(Base):
    __tablename__ = 'classroster'

    rosteryear = Column('rosteryear', Integer, primary_key=True)
    initialrosteramount = Column('initialrosteramount', Integer)
    currentenrollment = Column('currentenrollment', Integer)
    
    graduation = relationship('GraduationStatus', back_populates='roster')
    facultyAccess = relationship('FacultyAccess', back_populates='roster')

class Extracurricular(Base):
    __tablename__ = 'extracurriculars'

    extracurricularid = Column('extracurricularid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    activityname = Column('activityname', String(255))
    activitydescription = Column('activitydescription', String(255))
    weeklyHourCommitment = Column('weeklyhourcommitment', Integer)
    
    student = relationship('Student', back_populates='extracurriculars')