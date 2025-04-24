# backend/app/scripts/init_db.py
import os
from ..core.database import ensure_pgvector_extension

if __name__ == "__main__":
    
    os.system('python -m app.scripts.tables.nuke_reset')
    os.system('python -m app.scripts.tables.create_db')
    #ensure_pgvector_extension()
    os.system('python -m app.scripts.id_ingest')
    os.system('python -m app.scripts.block_ingest')
    os.system('python -m app.scripts.question_ingest')
    os.system('python -m app.scripts.chat_ingest')
    print("Database has been reset & reseeded!")