from sqlalchemy import Column, Integer, ForeignKey, String, relationship
from backend.app.core.database import Base

class Question(Base):
    __tablename__ = 'question'

    #questionID is surrogate key generated on default as an Identity
    questionID = Column('QuestionID', Integer, primary_key=True)
    examID = Column('ExamID', Integer, ForeignKey('exam.ExamID'))
    prompt = Column('Prompt', String(255), nullable=False)
    questionDifficulty = Column('QuestionDifficulty')

    exam = relationship('Exam', back_populates='question')