from sqlalchemy import Column, Integer, String, relationship, ForeignKey, Boolean, Identity, Date
from backend.app.core.database import Base
from examquestionmodels import Exam, Question

class ClassRoster(Base):
    __tablename__ = 'classroster'

    classRosterID = Column('ClassRosterID', Integer, Identity(start=1, increment=1), primary_key=True)
    rosterYear = Column('RosterYear', Date, nullable=False)
    initialRosterAmount = Column('IntialRosterAmount', Integer)
    currentEnrollment = Column('CurrentEnrollment', Integer)
    
    graduation = relationship('GraduationStatus', back_populates='roster')
    
#Will Most likely be scraping this part of the SQLDatabase as storage of senstiive information 
#Should not be stored on our database
class LoginInfo(Base):
    __tablename__ = 'LoginInfo'

    loginInfoID = Column('LoginInfoID', Integer, Identity(start=1, increment=10), primary_key=True)
    username = Column('Username', String(255), nullable=False)
    password = Column('Password', String(255), nullable=False)
    email = Column('Email', String(255))
    
    student = relationship('Student', back_populates='loginInfo')
    faculty = relationship("Faculty", back_populates='loginInfo')
    
class Student(Base):
    __tablename__ = 'Student'

    studentID = Column('StudentID', Integer, primary_key=True)
    loginInfoId = Column('LoginInfoID', Integer, ForeignKey('logininfo.LoginInfoID'))
    lastName = Column('LastName', String(40))
    firstName = Column('FirstName', String(40))
    
    #Refer to ERD to understand relationship connections
    loginInfo = relationship('LoginInfo', back_populates='student')
    extracurricular = relationship('Extracurriculars', back_populates='student')
    clerkshipStudent = relationship('Clerkship', back_populates='student')
    examResults = relationship('ExamResults', back_populates='student')
    graduationStatus = relationship('GraduationStatus', back_populates='student')
    #Found in classfacultymodels
    enrollmentRecord = relationship('EnrollmentRecord', back_populates='student')
    studentGrades = relationship('StudentGrade', back_populates = 'student')
    
    
class Extracurricular(Base):
    __tablename__ = 'Extracurriculars'

    extracurricularID = Column('ExtracurricularID', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    activityName = Column('ActivityName', String(255))
    activityDescription = Column('ActivityDescription', String(255))
    weeklyHourCommitment = Column('WeeklyHourCommitment', Integer)
    
    student = relationship('Student', back_populates='extracurricular')
    
class Clerkship(Base):
    __tablename__ = 'Clerkship'

    clerkshipID = Column('ClerkshipID', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    clerkshipName = Column('ClerkshipName', String(255), nullable=False)
    clerkshipDescription = Column('ClerkshipDescription', String(255))
    startDate = Column('StartDate', Date)
    endDate = Column('EndDate', Date)
    company = Column('Company', String(255))
    
    student = relationship('Student', back_populates='clerkshipStudent')
    examResults = relationship('ExamResults', back_populates='clerkship')
    
class ExamResults(Base):
    __tablename__ = 'ExamResults'

    examResultsID = Column('ExamResultsID', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    examID = Column('ExamID', Integer, ForeignKey('exam.ExamID'))
    clerkshipID = Column('ClerkshipID', Integer, ForeignKey('clerkship.ClerkshipID'))
    score = Column('Score', Integer, nullable=False)
    passOrFail = Column('PassOrFail', Boolean)
    
    student = relationship('Student', back_populates='examResults')
    clerkship = relationship('Clearkship', back_populates='examResults')
    questionPerformance = relationship('StudentQuestionPerformance', back_populates='examResults')
    exam = relationship('Exam', back_populates='examResults')
    
class StudentQuestionPerformance(Base):
    __tablename__ = 'StudentQuestionPerformance'

    performanceID = Column('StudentQuestionPerformanceID', Integer, Identity(start=1, increment=1), primary_key=True)
    examResultsID = Column('ExamResultsID', Integer, ForeignKey('examresults.ExamResultsID'))
    questionID = Column('QuestionID', Integer, ForeignKey('Question.QuestionID'))
    result = Column('Result', Boolean, nullable=False)
    
    examResults = relationship('ExamResults', back_popualtes='questionPerformance')
    question = relationship('Question', back_populates='questionPerformance')
    
class GraduationStatus(Base):
    __tablename__ = 'GraduationStatus'

    graduationStatusID = Column('GraduationStatusID', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    classRosterID = Column('ClassRosterID', Integer, ForeignKey('classroster.ClassRosterID'))
    graduationYear = Column('GraduationYear', Date)
    graduated = Column('Graduated', Boolean)
    graduationLength = Column('GraduationLength', Integer)
    status = Column('Status', String(255))
    
    student = relationship('Student', back_populates='graduationStatus')
    roster = relationship('ClassRoster', back_populates='graduationStatus')
    
    
    


