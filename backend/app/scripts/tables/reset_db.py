from app.core.database import (
    drop_all_tables,
    create_all_tables,
    list_tables
)

if __name__ == "__main__":
    list_tables()
    drop_all_tables()
    list_tables()
    create_all_tables()
    list_tables()