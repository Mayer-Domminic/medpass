import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.core.init_db import init_db

if __name__ == "__main__":
    init_db()