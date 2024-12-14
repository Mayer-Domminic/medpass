from sqlalchemy import Column, Integer, Date
from backend.app.core.database import Base

class ClassRoster(Base):
    __tablename__ = 'classroster'

    classRosterID = Column('ClassRosterID', Integer, primary_key=True)
    rosterYear = Column('RosterYear', Date, nullable=False)
    initialRosterAmount = Column('IntialRosterAmount', Integer)
    currentEnrollment = Column('CurrentEnrollment', Integer)


