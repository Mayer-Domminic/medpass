from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Identity, Float
from sqlalchemy.orm import relationship
from app.core.base import Base


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

class GradeClassification(Base):
    __tablename__ = 'gradeclassification'

    gradeclassificationid = Column('gradeclassificationid', Integer, Identity(start=1, increment=1), primary_key=True)
    classofferingid = Column('classofferingid', Integer, ForeignKey('classoffering.classofferingid'))
    classificationname = Column('classificationname', String(255), nullable=False)
    unittype = Column('unittype', String(50), nullable=False)
    
    offering = relationship('ClassOffering', back_populates='gradeClassification')
    studentGrades = relationship('StudentGrade', back_populates='gradeClassification')

