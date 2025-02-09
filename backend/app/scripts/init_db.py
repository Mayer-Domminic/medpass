import logging
import sys
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database
from ..core.config import settings
from ..core.database import Base
from ..models.user import User 
from ..models.studenttemp import Student

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    try:
        # Ensure the database URL is correct
        engine = create_engine(settings.sync_database_url)
        
        # Create the database if it doesn't exist
        if not database_exists(engine.url):
            create_database(engine.url)
            logger.info("Created database")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created all tables")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    logger.info("Creating initial database")
    init_db()
    logger.info("Database initialization completed")