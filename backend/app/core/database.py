from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import os

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        yield db
    finally:
        db.close()
        
#Run create tables
def create_table():
    
    filePath = os.path.join(
        "app", "scripts", "database.sql"
    )
    try:
        with open(filePath, 'r') as file:
            sqlCreate = file.read()
            db = next(get_db())
            db.execute(text(sqlCreate))
            db.commit()
            
        print(f"Create Tables using {filePath}")
        
    except FileNotFoundError:
        print(f"File not found at {filePath}")
        raise
    except Exception as e:
        print(f"An error occured: {e}")
        raise
    finally:
        db.close()
        
#Drop Tables
def drop_table():
    
    filePath = os.path.join(
        "app", "scripts", "drop.sql"
    )
    try:
        with open(filePath, 'r') as file:
            sqlCreate = file.read()
            db = next(get_db())
            db.execute(text(sqlCreate))
            db.commit()
            
        print(f"Dropped Tables Using: {filePath}")
        
    except FileNotFoundError:
        print(f"File not found at {filePath}")
        raise
    except Exception as e:
        print(f"An error occured: {e}")
        raise
    finally:
        db.close()
        
        
