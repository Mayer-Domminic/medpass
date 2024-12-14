from sqlalchemy import Column, Integer, String, relationship, ForeignKey
from backend.app.core.database import Base

class Faculty(Base):
    __tablename__ = 'Faculty'

    facultyID = Column('FacultyID', Integer, primary_key=True)
    loginInfoID = Column('LoginInfoID', Integer, ForeignKey('logininfo.LoginInfoID'))
    firstName = Column('FirstName', String(255))
    lastName = Column('LastName', String(255))
    position = Column('Position', String(255))

    loginInfo = relationship('LoginInfo')