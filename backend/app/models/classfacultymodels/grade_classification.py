from sqlalchemy import Column, Integer, String, relationship, ForeignKey
from backend.app.core.database import Base

class GradeClassification(Base):
    __tablename__ = 'GradeClassification'

    gradeClassificationID = Column('GradeClassificationID', Integer, primary_key=True)
    classOfferingID = Column('ClassOfferingID', Integer, ForeignKey('classoffering.ClassOfferingID'))
    classificationName = Column('ClassificationName', String(255), nullable=False)
    unitType = Column('UnitType', String(50), nullable=False)

    classOffering = relationship('ClassOffering')