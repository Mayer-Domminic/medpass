# backend/app/scripts/init_db.py
import os
from ..services.rag_service import ingest_document_directory

if __name__ == "__main__":
    
    filepath = class_filePath = os.path.join(
        "app", "scripts", "data", "ragdata"
    )
    
    os.system('python -m app.scripts.tables.nuke_reset')
    os.system('python -m app.scripts.tables.create_db')
    #ensure_pgvector_extension()
    os.system('python -m app.scripts.id_ingest')
    os.system('python -m app.scripts.block_ingest')
    os.system('python -m app.scripts.question_ingest')
    os.system('python -m app.scripts.chat_ingest')
    docnumbers = ingest_document_directory(filepath)
    print("Document ingestion complete!")
    print("Database has been reset & reseeded!")