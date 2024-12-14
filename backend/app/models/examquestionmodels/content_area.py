from sqlalchemy import Column, Integer, String, relationship
from backend.app.core.database import Base

class ContentArea(Base):
    __tablename__ = 'ContentArea'

    contentAreaID = Column('ContentAreaID', Integer, primary_key=True)
    contentName = Column('ContentName', String(255), nullable=False)
    description = Column('Descrption', String(255))
    discipline = Column('Discipline', String(40))

    questionClassification = relationship('QuestionClassification', back_populates = 'content_area')