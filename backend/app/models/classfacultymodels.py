from sqlalchemy import Column, Integer, String, relationship, ForeignKey, Boolean, Identity, Date, Float
from backend.app.core.database import Base
from studentinformationmodels import Student, LoginInfo

class Class(Base):
    __tablename__ = 'Class'

    classID = Column('ClassID', Integer, primary_key=True)
    className = Column('ClassName', String(255), nullable=False)
    classDescription = Column('ClassDescription', String(255))
    block = Column('Block', Integer)
    
    offering = relationship('ClassOffering', back_populates='classInfo')
    
class Faculty(Base):
    __tablename__ = 'Faculty'

    facultyID = Column('FacultyID', Integer, primary_key=True)
    loginInfoID = Column('LoginInfoID', Integer, ForeignKey('logininfo.LoginInfoID'))
    firstName = Column('FirstName', String(255))
    lastName = Column('LastName', String(255))
    position = Column('Position', String(255))
    
    loginInfo = relationship('LoginInfo', back_populates='faculty')
    offering = relationship('ClassOffering', back_populates='faculty')
    
class ClassOffering(Base):
    __tablename__ = 'ClassOffering'

    classOfferingID = Column('ClassOfferingID', Integer, primary_key=True)
    facultyID = Column('FacultyID', Integer, ForeignKey('faculty.FacultyID'))
    classID = Column('ClassID', Integer, ForeignKey('class.ClassID'))
    dateTaught = Column('DateTaught', Date)
    semester = Column('Semester', String(40))
    
    faculty = relationship('Faculty', back_populates='offering')
    classInfo = relationship('Class', back_populates='offering')
    gradeClassification = relationship('GradeClassification', back_populates='offering')
    enrolllmentRecord = relationship('EnrollmentRecord', back_populates='offering')
    

class GradeClassification(Base):
    __tablename__ = 'GradeClassification'

    gradeClassificationID = Column('GradeClassificationID', Integer, primary_key=True)
    classOfferingID = Column('ClassOfferingID', Integer, ForeignKey('classoffering.ClassOfferingID'))
    classificationName = Column('ClassificationName', String(255), nullable=False)
    unitType = Column('UnitType', String(50), nullable=False)
    
    offering = relationship('ClassOffering', back_populates='gradeClassification')
    studentGrades = relationship('StudentGrade', back_populates='gradeClassification')
    
class EnrollmentRecord(Base):
    __tablename__ = 'EnrollmentRecord'

    enrollmentRecordID = Column('EnrollmentRecord', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    classOfferingID = Column('ClassOfferingID', Integer, ForeignKey('classoffering.ClassOfferingID'))
    gradePercentage = Column('GradePercentage', Float)
    passFailStatus = Column('PassFailStatus', Boolean)
    attendancePercentage = Column('AttendancePercentage', Float)
    
    student = relationship('Student', back_populates='enrollmentRecord')
    offering = relationship('ClassOffering', back_populates='enrollmentRecord')
    
class StudentGrade(Base):
    __tablename__ = 'StudentGrade'

    studentGradeID = Column('StudentGradeID', Integer, Identity(start=1, increment=1), primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    gradeClassificationID = Column('GradeClassificationID', Integer, ForeignKey('gradeclassification.GradeClassificationID'))
    pointsEarned = Column('PointsEarned', Float)
    pointsAvailable = Column('PointsAvailable', Float)
    dateRecorded = Column('DateRecorded', Date)
    
    student = relationship('Student', back_populates='studentGrades')
    gradeClassification = relationship('GradeClassification', back_populates='studentGrades')
