from sqlalchemy import Column, Integer, String, relationship, ForeignKey
from backend.app.core.database import Base

class Student(Base):
    __tablename__ = 'Student'

    studentID = Column('StudentID', Integer, primary_key=True)
    loginInfoId = Column('LoginInfoID', Integer, ForeignKey('logininfo.LoginInfoID'))
    lastName = Column('LastName', String(40))
    firstName = Column('FirstName', String(40))

    loginInfo = relationship('LoginInfo')