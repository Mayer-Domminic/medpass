import pytest
from sqlalchemy import text
from app.core.database import get_db, engine

def test_database_connection():
    """Test that the database connection is working."""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar() == 1
        
def test_get_db_dependency():
    """Test that the get_db dependency yields a working session."""
    db = next(get_db())
    
    result = db.execute(text("SELECT 1"))
    assert result.scalar() == 1
    
    db.close()