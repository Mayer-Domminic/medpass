from sqlalchemy import Column, Integer, String
from backend.app.core.database import Base

class Class(Base):
    __tablename__ = 'Class'

    classID = Column('ClassID', Integer, primary_key=True)
    className = Column('ClassName', String(255), nullable=False)
    classDescription = Column('ClassDescription', String(255))
    block = Column('Block', Integer)