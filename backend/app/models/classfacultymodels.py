from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Identity, Date, Float
from sqlalchemy.orm import relationship
from ..core.database import Base

class Class(Base):
    __tablename__ = 'class'

    classID = Column('ClassID', Integer, primary_key=True)
    className = Column('ClassName', String(255), nullable=False)
    classDescription = Column('ClassDescription', String(255))
    block = Column('Block', Integer)
    
    offering = relationship('ClassOffering', back_populates='classInfo')
    
class Faculty(Base):
    __tablename__ = 'faculty'

    facultyID = Column('facultyid', Integer, primary_key=True)
    loginInfoID = Column('logininfoid', Integer, ForeignKey('logininfo.logininfoid'))
    firstName = Column('firstname', String(255))
    lastName = Column('lastname', String(255))
    position = Column('position', String(255))
    
    loginInfo = relationship('LoginInfo', back_populates='faculty')
    offering = relationship('ClassOffering', back_populates='faculty')
    
class ClassOffering(Base):
    __tablename__ = 'classoffering'

    classOfferingID = Column('classofferingid', Integer, primary_key=True)
    facultyID = Column('facultyid', Integer, ForeignKey('faculty.facultyid'))
    classID = Column('classid', Integer, ForeignKey('class.ClassID'))
    dateTaught = Column('datetaught', Date)
    semester = Column('semester', String(40))
    
    faculty = relationship('Faculty', back_populates='offering')
    classInfo = relationship('Class', back_populates='offering')
    gradeClassification = relationship('GradeClassification', back_populates='offering')
    enrollmentRecord = relationship('EnrollmentRecord', back_populates='offering')
    

class GradeClassification(Base):
    __tablename__ = 'gradeclassification'

    gradeClassificationID = Column('gradeclassificationid', Integer, primary_key=True)
    classOfferingID = Column('classOfferingid', Integer, ForeignKey('classoffering.classofferingid'))
    classificationName = Column('classificationname', String(255), nullable=False)
    unitType = Column('unittype', String(50), nullable=False)
    
    offering = relationship('ClassOffering', back_populates='gradeClassification')
    studentGrades = relationship('StudentGrade', back_populates='gradeClassification')
    
class EnrollmentRecord(Base):
    __tablename__ = 'enrollmentrecord'

    enrollmentRecordID = Column('enrollmentrecord', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('studentid', Integer, ForeignKey('student.studentid'))
    classOfferingID = Column('classofferingid', Integer, ForeignKey('classoffering.classofferingid'))
    gradePercentage = Column('gradepercentage', Float)
    passFailStatus = Column('passfailstatus', Boolean)
    attendancePercentage = Column('attendancepercentage', Float)
    
    student = relationship('Student', back_populates='enrollmentRecord')
    offering = relationship('ClassOffering', back_populates='enrollmentRecord')
    
class StudentGrade(Base):
    __tablename__ = 'studentgrade'

    studentGradeID = Column('studentgradeid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('studentid', Integer, ForeignKey('student.studentid'))
    gradeClassificationID = Column('gradeclassificationid', Integer, ForeignKey('gradeclassification.gradeclassificationid'))
    pointsEarned = Column('pointsearned', Float)
    pointsAvailable = Column('pointsavailable', Float)
    dateRecorded = Column('daterecorded', Date)
    
    student = relationship('Student', back_populates='studentGrades')
    gradeClassification = relationship('GradeClassification', back_populates='studentGrades')
