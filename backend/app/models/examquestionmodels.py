from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Identity
from sqlalchemy.orm import relationship
from ..core.database import Base

class Exam(Base):
    __tablename__ = 'exam'

    examid = Column('examid', Integer, Identity(start=1, increment=1), primary_key=True, index=True)
    examname = Column('examname', String(255), nullable=False)
    examdescription = Column('examdescription', String(255))

    questions = relationship('Question', back_populates='exam')
    examResults = relationship('ExamResults', back_populates='exam')
    
class ContentArea(Base):
    __tablename__ = 'contentarea'

    contentAreaID = Column('contentareaid', Integer, primary_key=True)
    contentName = Column('contentname', String(255), nullable=False)
    description = Column('description', String(255))
    discipline = Column('discipline', String(40))

    classification = relationship('QuestionClassification', back_populates = 'contentArea')
    
class Option(Base):
    __tablename__ = 'option'

    optionID = Column('optionid', Integer, primary_key=True)
    optionDescription = Column('optiondescription', String(255), nullable=False)

    questionOptions = relationship('QuestionOption', back_populates='option')
    
class Question(Base):
    __tablename__ = 'question'

    #questionID is surrogate key generated on default as an Identity
    questionID = Column('questionid', Integer, Identity(start=10, increment=1), primary_key=True)
    examID = Column('examid', Integer, ForeignKey('exam.examid'))
    prompt = Column('prompt', String(255), nullable=False)
    questionDifficulty = Column('questiondifficulty', String(40))

    exam = relationship('Exam', back_populates='questions')
    classification = relationship('QuestionClassification', back_populates='question')
    questionOptions = relationship('QuestionOption', back_populates='question')
    questionPerformance = relationship('StudentQuestionPerformance', back_populates='question')
    
class QuestionClassification(Base):
    __tablename__ = 'questionclassification'

    questionClassID = Column('questionclassid', Integer, Identity(start=1, increment=1), primary_key=True)
    questionID = Column('questionid', Integer, ForeignKey('question.questionid'))
    contentAreaID = Column('contentareaid', Integer, ForeignKey('contentarea.contentareaid'))
    
    contentArea = relationship('ContentArea', back_populates='classification')
    question = relationship('Question', back_populates='classification')

class QuestionOption(Base):
    __tablename__ = 'questionoptions'

    questionOptionID = Column('questionoptionid', Integer, Identity(start=1, increment=1), primary_key=True)
    questionID = Column('questionid', Integer, ForeignKey('question.questionid'))
    optionID = Column('optionid', Integer, ForeignKey('option.optionid'))
    correct_answer = Column('correctanswer', Boolean)
    
    question = relationship('Question', back_populates='questionOptions')
    option = relationship('Option', back_populates='questionOptions')
    