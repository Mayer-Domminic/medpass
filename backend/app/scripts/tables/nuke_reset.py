from app.core.database import (
    nuclear_clean,
    create_all_tables,
    list_tables
)

if __name__ == "__main__":
    list_tables()
    nuclear_clean()  # Removes EVERYTHING
    list_tables()
    create_all_tables()  # Creates fresh tables from models
    list_tables()