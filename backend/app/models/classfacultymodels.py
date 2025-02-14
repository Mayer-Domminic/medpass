from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Identity, Date, Float
from sqlalchemy.orm import relationship
from . import Base

class Class(Base):
    __tablename__ = 'class'

    classid = Column('ClassID', Integer, primary_key=True)
    classname = Column('ClassName', String(255), nullable=False)
    classdescription = Column('ClassDescription', String(255))
    block = Column('Block', Integer)
    
    offering = relationship('ClassOffering', back_populates='classInfo')
    
class Faculty(Base):
    __tablename__ = 'faculty'

    facultyid = Column('facultyid', Integer, primary_key=True)
    loginInfoid = Column('logininfoid', Integer, ForeignKey('logininfo.logininfoid'))
    firstname = Column('firstname', String(255))
    lastname = Column('lastname', String(255))
    position = Column('position', String(255))
    
    loginInfo = relationship('LoginInfo', back_populates='faculty')
    offering = relationship('ClassOffering', back_populates='faculty')
    
class ClassOffering(Base):
    __tablename__ = 'classoffering'

    classofferingid = Column('classofferingid', Integer, primary_key=True)
    facultyid = Column('facultyid', Integer, ForeignKey('faculty.facultyid'))
    classid = Column('classid', Integer, ForeignKey('class.ClassID'))
    datetaught = Column('datetaught', Date)
    semester = Column('semester', String(40))
    
    faculty = relationship('Faculty', back_populates='offering')
    classInfo = relationship('Class', back_populates='offering')
    gradeClassification = relationship('GradeClassification', back_populates='offering')
    enrollmentRecord = relationship('EnrollmentRecord', back_populates='offering')
    

class GradeClassification(Base):
    __tablename__ = 'gradeclassification'

    gradeclassificationid = Column('gradeclassificationid', Integer, primary_key=True)
    classfferingid = Column('classOfferingid', Integer, ForeignKey('classoffering.classofferingid'))
    classificationmame = Column('classificationname', String(255), nullable=False)
    unitType = Column('unittype', String(50), nullable=False)
    
    offering = relationship('ClassOffering', back_populates='gradeClassification')
    studentGrades = relationship('StudentGrade', back_populates='gradeClassification')
    
class EnrollmentRecord(Base):
    __tablename__ = 'enrollmentrecord'

    enrollmentrecordid = Column('enrollmentrecordid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    classofferingid = Column('classofferingid', Integer, ForeignKey('classoffering.classofferingid'))
    gradepercentage = Column('gradepercentage', Float)
    passfailstatus = Column('passfailstatus', Boolean)
    attendancepercentage = Column('attendancepercentage', Float)
    
    student = relationship('Student', back_populates='enrollmentRecord')
    offering = relationship('ClassOffering', back_populates='enrollmentRecord')
    
class StudentGrade(Base):
    __tablename__ = 'studentgrade'

    studentgradeid = Column('studentgradeid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    gradeclassificationid = Column('gradeclassificationid', Integer, ForeignKey('gradeclassification.gradeclassificationid'))
    pointsearned = Column('pointsearned', Float)
    pointsavailable = Column('pointsavailable', Float)
    daterecorded = Column('daterecorded', Date)
    
    student = relationship('Student', back_populates='studentGrades')
    gradeClassification = relationship('GradeClassification', back_populates='studentGrades')
