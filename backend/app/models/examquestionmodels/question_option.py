from sqlalchemy import Column, Integer, Boolean, relationship, ForeignKey
from backend.app.core.database import Base

class QuestionOption(Base):
    __tablename__ = 'QuestionOptions'

    questionOptionID = Column('QuestionOptionID', Integer, primary_key=True)
    questionID = Column('QuestionID', Integer, ForeignKey('question.QuestionID'))
    optionID = Column('OptionID', Integer, ForeignKey('option.OptionID'))
    correct_answer = Column('CorrectAnswer', Boolean)

    question = relationship('Question', back_populates='question')
    option = relationship('Option', back_populates= 'option')