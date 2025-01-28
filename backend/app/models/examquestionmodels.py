from sqlalchemy import Column, Integer, String, relationship, ForeignKey, Boolean, Identity
from backend.app.core.database import Base

class Exam(Base):
    __tablename__ = 'Exam'

    examID = Column('ExamID', Integer, primary_key=True, index=True)
    examName = Column('ExamName', String(255), nullable=False),
    examDescription = Column('ExamDescription', String(255))

    questions = relationship('Question', back_populates='exam')
    
class ContentArea(Base):
    __tablename__ = 'ContentArea'

    contentAreaID = Column('ContentAreaID', Integer, primary_key=True)
    contentName = Column('ContentName', String(255), nullable=False)
    description = Column('Descrption', String(255))
    discipline = Column('Discipline', String(40))

    classification = relationship('QuestionClassification', back_populates = 'contentArea')
    
class Option(Base):
    __tablename__ = 'option'

    optionID = Column('OptionID', Integer, primary_key=True)
    optionDescription = Column('OptionDescription', String(255), nullable=False)

    questionOptions = relationship('QuestionOptions', back_populates='option')
    
class Question(Base):
    __tablename__ = 'question'

    #questionID is surrogate key generated on default as an Identity
    questionID = Column('QuestionID', Integer, Identity(Start=10, increment=1), primary_key=True)
    examID = Column('ExamID', Integer, ForeignKey('Exam.ExamID'))
    prompt = Column('Prompt', String(255), nullable=False)
    questionDifficulty = Column('QuestionDifficulty', String(40))

    exam = relationship('Exam', back_populates='questions')
    classification = relationship('QuestionClassificaiton', back_populates='question')
    questionOptions = relationship('QuestionOptions', back_populates='question')
    
class QuestionClassification(Base):
    __tablename__ = 'QuestionClassification'

    questionClassID = Column('QuestionClassID', Integer, Identity(start=1, increment=1), primary_key=True)
    questionID = Column('QuestionID', Integer, ForeignKey('question.QuestionID'))
    contentAreaID = Column('ContentAreaID', Integer, ForeignKey('contentArea.ContentAreaID'))
    
    contentArea = relationship('ContentArea', back_populates='classification')
    question = relationship('Question', back_populates='classification')

class QuestionOption(Base):
    __tablename__ = 'QuestionOptions'

    questionOptionID = Column('QuestionOptionID', Integer, Identity(start=1, increment=1), primary_key=True)
    questionID = Column('QuestionID', Integer, ForeignKey('question.QuestionID'))
    optionID = Column('OptionID', Integer, ForeignKey('option.OptionID'))
    correct_answer = Column('CorrectAnswer', Boolean)
    
    question = relationship('Question', back_populates='questionOptions')
    option = relationships('Option', back_populates='questionOptions')
    