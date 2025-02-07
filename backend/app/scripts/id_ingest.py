import pandas as pd
import numpy as np
from ..models import Student
from ..api.deps import get_db
from ..core.database import create_table, drop_table
import os

if __name__ == "__main__":
    drop_table()
    #create_table()