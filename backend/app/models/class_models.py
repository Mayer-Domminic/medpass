from sqlalchemy import Column, Integer, String, ForeignKey, Identity, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.base import Base
from datetime import datetime

class Class(Base):
    __tablename__ = 'class'

    classid = Column('ClassID', Integer, primary_key=True)
    classname = Column('ClassName', String(255), nullable=False)
    classdescription = Column('ClassDescription', String(255))
    block = Column('Block', Integer)
    
    offering = relationship('ClassOffering', back_populates='classInfo')
    domainIntersection = relationship('ClassDomain', back_populates='classInfo')

class ClassOffering(Base):
    __tablename__ = 'classoffering'

    classofferingid = Column('classofferingid', Integer, Identity(start=1, increment=1), primary_key=True)
    facultyid = Column('facultyid', Integer, ForeignKey('faculty.facultyid'))
    classid = Column('classid', Integer, ForeignKey('class.ClassID'))
    datetaught = Column('datetaught', Integer)
    semester = Column('semester', String(40))
    
    faculty = relationship('Faculty', back_populates='offering')
    classInfo = relationship('Class', back_populates='offering')
    gradeClassification = relationship('GradeClassification', back_populates='offering')
    enrollmentRecord = relationship('EnrollmentRecord', back_populates='offering')
    
class Domain(Base):
    __tablename__ = 'domain'
    
    domainid = Column('domainid', Integer, Identity(start=1, increment=1), primary_key=True)
    domainname = Column('domainname', String(255), nullable=False)
    weight = Column('weight', Integer)
    
    domainIntersection = relationship('ClassDomain', back_populates='domainInfo')
    
class ClassDomain(Base):
    __tablename__ = 'classdomain'
    
    classdomainid = Column('classdomainid', Integer, Identity(start=1, increment=1), primary_key=True)
    classid = Column('classid', Integer, ForeignKey('class.ClassID'))
    domainid = Column('domaindid', Integer, ForeignKey('domain.domainid'))
    
    classInfo = relationship('Class', back_populates='domainIntersection')
    domainInfo = relationship('Domain', back_populates='domainIntersection')

class GeneratedQuestion(Base):
    __tablename__ = 'generated_questions'

    id = Column('id', Integer, Identity(start=1, increment=1), primary_key=True)
    student_id = Column('student_id', Integer, ForeignKey('student.studentid'), nullable=False)
    domain = Column('domain', String(255), nullable=False)
    subdomain = Column('subdomain', String(255), nullable=False)
    question_text = Column('question_text', Text, nullable=False)
    options = Column('options', JSONB, nullable=False)
    correct_option = Column('correct_option', String(50), nullable=False)
    explanation = Column('explanation', Text)
    difficulty = Column('difficulty', String(50))
    created_at = Column('created_at', DateTime, default=datetime.utcnow)
    
    #stats
    times_practiced = Column('times_practiced', Integer, default=0)
    times_correct = Column('times_correct', Integer, default=0)
    
    student = relationship('Student', back_populates='generated_questions')