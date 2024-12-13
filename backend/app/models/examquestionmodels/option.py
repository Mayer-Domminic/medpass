from sqlalchemy import Column, Integer, String, relationship
from backend.app.core.database import Base

class Option(Base):
    __tablename__ = 'option'

    optionID = Column('OptionID', Integer, primary_key=True)
    optionDescription = Column('OptionDescription', String(255), nullable=False)

    questionOptions = relationship('QuestionOptions', back_populates='option')