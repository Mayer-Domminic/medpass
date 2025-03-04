from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Identity, Float
from sqlalchemy.orm import relationship
from app.core.base import Base

class LoginInfo(Base):
    __tablename__ = 'logininfo'

    logininfoid = Column('logininfoid', Integer, Identity(start=1, increment=10), primary_key=True)
    username = Column('username', String(255), nullable=False)
    password = Column('password', String(255), nullable=False)
    isactive = Column('isactive', Boolean)
    issuperuser = Column('issuperuser', Boolean)
    createdat = Column('createdat', Date)
    updatedat = Column('updatedat', Date)
    email = Column('email', String(255))
    
    student = relationship('Student', back_populates='loginInfo') 
    faculty = relationship('Faculty', back_populates='loginInfo')

class Student(Base):
    __tablename__ = 'student'

    studentid = Column('studentid', Integer, primary_key=True)
    logininfoid = Column('logininfoid', Integer, ForeignKey('logininfo.logininfoid'))
    lastname = Column('lastname', String(40))
    firstname = Column('firstname', String(40))
    cumgpa = Column('cumgpa', Float)
    bcpmgpa = Column('bcpmgpa', Float)
    mmicalc = Column('mmicalc', Float)
    
    #Refer to ERD to understand relationship connections
    loginInfo = relationship('LoginInfo', back_populates='student')
    extracurriculars = relationship('Extracurricular', back_populates='student')
    clerkships = relationship('Clerkship', back_populates='student')
    examResults = relationship('ExamResults', back_populates='student')
    graduationStatus = relationship('GraduationStatus', back_populates='student')
    #Found in classfacultymodels
    enrollmentRecord = relationship('EnrollmentRecord', back_populates='student')
    studentGrades = relationship('StudentGrade', back_populates='student')

class Faculty(Base):
    __tablename__ = 'faculty'

    facultyid = Column('facultyid', Integer, primary_key=True)
    logininfoid = Column('logininfoid', Integer, ForeignKey('logininfo.logininfoid'))
    firstname = Column('firstname', String(255))
    lastname = Column('lastname', String(255))
    position = Column('position', String(255))
    
    loginInfo = relationship('LoginInfo', back_populates='faculty')
    offering = relationship('ClassOffering', back_populates='faculty')

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
