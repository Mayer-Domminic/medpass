from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Identity
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.base import Base


class Exam(Base):
    __tablename__ = 'exam'

    examid = Column('examid', Integer, Identity(start=1, increment=1), primary_key=True, index=True)
    examname = Column('examname', String(255), nullable=False)
    examdescription = Column('examdescription', String(255))
    passscore = Column('passscore', Integer)
    examtype = Column('examtype', String(50))

    questions = relationship('Question', back_populates='exam')
    examResults = relationship('ExamResults', back_populates='exam')

class ContentArea(Base):
    __tablename__ = 'contentarea'

    contentareaid = Column('contentareaid', Integer, primary_key=True)
    contentname = Column('contentname', String(255), nullable=False)
    description = Column('description', String(255))
    discipline = Column('discipline', String(40))

    classification = relationship('QuestionClassification', back_populates = 'contentArea')

class Option(Base):
    __tablename__ = 'option'

    optionid = Column('optionid', Integer, primary_key=True)
    optiondescription = Column('optiondescription', String(255), nullable=False)

    questionOptions = relationship('QuestionOption', back_populates='option')
    
class Question(Base):
    __tablename__ = 'question'

    #questionID is surrogate key generated on default as an Identity
    questionid = Column('questionid', Integer, Identity(start=10, increment=1), primary_key=True)
    examid = Column('examid', Integer, ForeignKey('exam.examid'))
    prompt = Column('prompt', String(255), nullable=False)
    questionDifficulty = Column('questiondifficulty', String(40))
    imageUrl = Column('imageurl', String(255))
    imageDependent = Column('imagedependent', Boolean)
    imageDescription = Column('imagedescription', String(255))
    
    embedding = Column(Vector(3072), nullable=True)

    exam = relationship('Exam', back_populates='questions')
    classification = relationship('QuestionClassification', back_populates='question')
    questionOptions = relationship('QuestionOption', back_populates='question')
    questionPerformance = relationship('StudentQuestionPerformance', back_populates='question')
    
class QuestionClassification(Base):
    __tablename__ = 'questionclassification'

    questionclassid = Column('questionclassid', Integer, Identity(start=1, increment=1), primary_key=True)
    questionid = Column('questionid', Integer, ForeignKey('question.questionid'))
    contentareaid = Column('contentareaid', Integer, ForeignKey('contentarea.contentareaid'))
    
    contentArea = relationship('ContentArea', back_populates='classification')
    question = relationship('Question', back_populates='classification')

class QuestionOption(Base):
    __tablename__ = 'questionoptions'

    questionoptionid = Column('questionoptionid', Integer, Identity(start=1, increment=1), primary_key=True)
    questionid = Column('questionid', Integer, ForeignKey('question.questionid'))
    optionid = Column('optionid', Integer, ForeignKey('option.optionid'))
    correctanswer = Column('correctanswer', Boolean)
    explanation = Column('explanation', String(255))
    
    question = relationship('Question', back_populates='questionOptions')
    option = relationship('Option', back_populates='questionOptions')
