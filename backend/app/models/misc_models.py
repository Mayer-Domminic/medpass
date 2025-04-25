from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Identity, Text, DateTime, func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
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
    
class Document(Base):
    __tablename__ = 'document'
    
    documentid = Column('documentid', Integer, Identity(start=1, increment=1), primary_key=True)
    title = Column('title', String(255))
    author = Column('author', String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    facultyid = Column('facultyid', Integer, ForeignKey('faculty.facultyid'))
    
    faculty = relationship('Faculty', back_populates='documents')
    
class DocumentChunk(Base):
    __tablename__ = 'documentchunk'
    
    documentchunkid = Column('documentchunkid', Integer, Identity(start=1, increment=1), primary_key=True)
    documentid = Column('documentid', Integer, ForeignKey('document.documentid'))
    chuntindex = Column('chunkindex', Integer)
    content = Column('content', Text)
    embedding = Column('embedding', Vector(3072), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    document = relationship('Document', back_populates='chunks')