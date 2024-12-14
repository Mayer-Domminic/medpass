from sqlalchemy import Column, Integer, String, relationship, ForeignKey
from backend.app.core.database import Base

class QuestionClassification(Base):
    __tablename__ = 'QuestionClassification'

    questionClassID = Column('QuestionClassID', Integer, primary_key=True)
    questionID = Column('QuestionID', Integer, ForeignKey('question.QuestionID'))
    contentAreaID = Column('ContentAreaID', Integer, ForeignKey('contentArea.ContentAreaID'))

    question = relationship('Question', back_populates='question')
    content_area = relationship('ContentArea', back_populates='content_area')