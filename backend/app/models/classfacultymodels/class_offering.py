from sqlalchemy import Column, Integer, String, Date, relationship, ForeignKey
from backend.app.core.database import Base

class ClassOffering(Base):
    __tablename__ = 'ClassOffering'

    classOfferingID = Column('ClassOfferingID', Integer, primary_key=True)
    facultyID = Column('FacultyID', Integer, ForeignKey('faculty.FacultyID'))
    classID = Column('ClassID', Integer, ForeignKey('class.ClassID'))
    dateTaught = Column('DateTaught', Date)
    semester = Column('Semester', String(40))

    faculty = relationship('Faculty')
    #using class_ temp will change names as it causes conflicts in python
    class_ = relationship('Class')