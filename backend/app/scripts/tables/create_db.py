from app.core.database import create_all_tables, list_tables, print_table_schemas
# SQLAlchemy Base
from app.models import *

def main():
    """Initialize all database tables."""
    print("Creating database tables...")
    create_all_tables()
    
    print("\nVerifying created tables:")
    list_tables()
    
if __name__ == "__main__":
    main()
