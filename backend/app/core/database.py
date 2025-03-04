from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.orm import sessionmaker
from app.models import Student, LoginInfo
from .config import settings
from .base import Base
import math

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def drop_all_tables():
    """Drop all tables in the database."""
    Base.metadata.drop_all(engine)
    print("All tables dropped.")

def create_all_tables():
    """Create all tables defined in models."""
    Base.metadata.create_all(engine)
    print("All tables created.")

def list_tables():
    """List all existing tables."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Existing tables:", tables)

def get_table_schemas():
    """Return table schemas with columns and types."""
    metadata = MetaData()
    metadata.reflect(bind=engine)
    return {
        table.name: {
            "columns": {col.name: str(col.type) for col in table.columns},
            "primary_key": [key.name for key in table.primary_key]
        }
        for table in metadata.tables.values()
    }

def print_table_schemas():
    """Print formatted table schemas."""
    schemas = get_table_schemas()
    for name, schema in schemas.items():
        print(f"\n=== {name.upper()} ===")
        print(f"Columns ({len(schema['columns'])}) | Primary Key: {', '.join(schema['primary_key']) or 'None'}")
        for col, type_ in schema['columns'].items():
            print(f"  → {col}: {type_}")

def nuclear_clean():
    """Drop all tables regardless of model registration"""
    metadata = MetaData()
    
    with engine.begin() as conn:
        # Reflect all existing tables
        metadata.reflect(bind=engine)
        
        # Drop all known tables first
        metadata.drop_all(bind=engine)
        
        # Drop any remaining tables (including those not in models)
        inspector = inspect(engine)
        remaining = inspector.get_table_names()
        
        if remaining:
            tables = ', '.join([f'"{table}"' for table in remaining])
            conn.execute(text(f'DROP TABLE IF EXISTS {tables} CASCADE'))
            
        # Drop all sequences
        sequences = inspector.get_sequence_names()
        if sequences:
            seqs = ', '.join([f'"{seq}"' for seq in sequences])
            conn.execute(text(f'DROP SEQUENCE IF EXISTS {seqs} CASCADE'))
    
    print("Complete database wipe performed")
    
def link_logininfo(studentid, logininfoid):
    db = next(get_db())
    
    #Removes old link
    other_users = db.query(Student).filter(Student.logininfoid == logininfoid).all()
    for user in other_users:
        user.logininfoid = None
        db.commit()
    
    student = db.query(Student).filter(Student.studentid == studentid).first()
    
    if student:
        student.logininfoid = logininfoid
        student.firstname = "lebron"
        student.lastname = "james"
        db.commit()
        
    db.close()
    
    
