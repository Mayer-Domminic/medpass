from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect
from .config import settings
from ..models import Base
from ..models.classfacultymodels import Class, Faculty, ClassOffering
from ..models.studentinformationmodels import Student
from ..models.examquestionmodels import Exam, Question
import os

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# get a database session
def get_db():
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        yield db
    finally:
        db.close()

# drop all tables
def drop_all_tables():
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped.")

# create all tables
def create_all_tables():
    Base.metadata.create_all(bind=engine)
    print("All tables created.")

# (drop and recreate tables)
def reset_database():
    drop_all_tables()
    create_all_tables()
    print("Database reset complete.")

def list_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Existing tables:", tables)