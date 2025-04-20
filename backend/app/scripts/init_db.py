import os

if __name__ == "__main__":
    os.system('python -m app.scripts.tables.nuke_reset')
    os.system('python -m app.scripts.tables.create_db')
    os.system('python -m app.scripts.id_ingest')
    os.system('python -m app.scripts.block_ingest')
    os.system('python -m app.scripts.question_ingest')
    print("Database has been reset & reseeded!")