from sqlalchemy import Column, Integer, String
from backend.app.core.database import Base

class LoginInfo(Base):
    __tablename__ = 'LoginInfo'

    loginInfoID = Column('LoginInfoID', Integer, primary_key=True)
    username = Column('Username', String(255), nullable=False)
    password = Column('Password', String(255), nullable=False)
    email = Column('Email', String(255))