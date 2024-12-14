from sqlalchemy import Column, Integer, Date, String, relationship, ForeignKey
from backend.app.core.database import Base

class Clerkship(Base):
    __tablename__ = 'Clerkship'

    clerkshipID = Column('ClerkshipID', Integer, primary_key=True)
    studentID = Column('StudentID', Integer, ForeignKey('student.StudentID'))
    clerkshipName = Column('ClerkshipName', String(255), nullable=False)
    clerkshipDescription = Column('ClerkshipDescription', String(255))
    startDate = Column('StartDate', Date)
    endDate = Column('EndDate', Date)
    company = Column('Company', String(255))

    student = relationship('Student')