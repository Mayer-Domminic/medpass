from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Identity, Date, Float
from sqlalchemy.orm import relationship
from . import Base
from .classfacultymodels import Faculty
from .examquestionmodels import Exam

class ClassRoster(Base):
    __tablename__ = 'classroster'

    rosteryear = Column('rosteryear', Integer, primary_key=True)
    initialrosteramount = Column('initialrosteramount', Integer)
    currentenrollment = Column('currentenrollment', Integer)
    
    graduation = relationship('GraduationStatus', back_populates='roster')

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
    
    
class Extracurricular(Base):
    __tablename__ = 'extracurriculars'

    extracurricularid = Column('extracurricularid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    activityname = Column('activityname', String(255))
    activitydescription = Column('activitydescription', String(255))
    weeklyHourCommitment = Column('weeklyhourcommitment', Integer)
    
    student = relationship('Student', back_populates='extracurriculars')
    
class Clerkship(Base):
    __tablename__ = 'clerkship'

    clerkshipid = Column('clerkshipid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    clerkshipname = Column('clerkshipname', String(255), nullable=False)
    clerkshipdescription = Column('clerkshipdescription', String(255))
    startdate = Column('startdate', Date)
    enddate = Column('enddate', Date)
    company = Column('company', String(255))
    
    student = relationship('Student', back_populates='clerkships')
    examResults = relationship('ExamResults', back_populates='clerkship')
    
class ExamResults(Base):
    __tablename__ = 'examresults'

    examresultsid = Column('examresultsid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    examid = Column('examid', Integer, ForeignKey('exam.examid'))
    clerkshipid = Column('clerkshipid', Integer, ForeignKey('clerkship.clerkshipid'))
    score = Column('score', Integer, nullable=False)
    passorfail = Column('passorfail', Boolean)
    
    student = relationship('Student', back_populates='examResults')
    clerkship = relationship('Clerkship', back_populates='examResults')
    questionPerformance = relationship('StudentQuestionPerformance', back_populates='examResults')
    exam = relationship('Exam', back_populates='examResults')
    
class StudentQuestionPerformance(Base):
    __tablename__ = 'studentquestionperformance'

    studentquestionperformanceid = Column('studentquestionperformanceid', Integer, Identity(start=1, increment=1), primary_key=True)
    examresultid = Column('examresultsid', Integer, ForeignKey('examresults.examresultsid'))
    questionid = Column('questionid', Integer, ForeignKey('question.questionid'))
    result = Column('result', Boolean, nullable=False)
    
    examResults = relationship('ExamResults', back_populates='questionPerformance')
    question = relationship('Question', back_populates='questionPerformance')
    
class GraduationStatus(Base):
    __tablename__ = 'graduationstatus'

    graduationstatusid = Column('graduationstatusid', Integer, Identity(start=1, increment=1), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    rosteryear = Column('rosteryear', Integer, ForeignKey('classroster.rosteryear'))
    graduationyear = Column('graduationyear', Integer)
    graduated = Column('graduated', Boolean)
    graduationlength = Column('graduationlength', Integer)
    status = Column('status', String(255))
    
    student = relationship('Student', back_populates='graduationStatus')
    roster = relationship('ClassRoster', back_populates='graduation')
    
