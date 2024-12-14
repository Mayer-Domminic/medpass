from sqlalchemy import Column, Integer, Boolean, relationship, ForeignKey
from backend.app.core.database import Base

class StudentQuestionPerformance(Base):
    __tablename__ = 'StudentQuestionPerformance'

    performanceID = Column('StudentQuestionPerformanceID', Integer, primary_key=True)
    examResultsID = Column('ExamResultsID', Integer, ForeignKey('examresults.ExamResultsID'))
    questionID = Column('QuestionID', Integer, ForeignKey('question.QuestionID'))
    result = Column('Result', Boolean, nullable=False)

    examResults = relationship('ExamResults')
    question = relationship('Question')