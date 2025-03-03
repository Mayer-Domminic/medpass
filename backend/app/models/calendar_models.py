from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.base import Base

class CalendarCredential(Base):
    __tablename__ = 'calendarcredential'
    
    calendarcredentialid = Column('calendarcredentialid', Integer, primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    tokendata = Column('tokendata', Text, nullable=False)
    
    student = relationship('Student', back_populates='calendar_credentials')

class CalendarEvent(Base):
    __tablename__ = 'calendarevent'
    
    eventid = Column('eventid', String(255), primary_key=True)
    studentid = Column('studentid', Integer, ForeignKey('student.studentid'))
    title = Column('title', String(255), nullable=False)
    description = Column('description', Text)
    starttime = Column('starttime', DateTime, nullable=False)
    endtime = Column('endtime', DateTime, nullable=False)
    location = Column('location', String(255))
    isrecurring = Column('isrecurring', Boolean, default=False)
    recurrencerule = Column('recurrencerule', String(255))
    
    student = relationship('Student', back_populates='calendar_events')