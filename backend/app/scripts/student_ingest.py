import pandas as pd
import numpy as np
from ..models import Student
from ..api.deps import get_db
import os

if __name__ == "__main__":
    print("Current working directory:", os.getcwd())
    
    file_path = os.path.join(
        "app", "scripts", "data", "Deidentified Reports (1).xlsx"
    )
    
    UNR_DATA = pd.read_excel(file_path, sheet_name=None)
    UNR_FULL_DATA = UNR_DATA['Full ID List']
    UNR_FULL_DATA = UNR_FULL_DATA.drop([
        'Bl1_5av_calc', 'Bl6-10av_calc', 'Bl1-10av_calc', 
        'Graduated.4yr', 'Graduated.5yr', 'Graduated.6yr', 
        'Graduated.>6yr', 'Grad.yrs'
    ], axis=1)

    STUDENT = UNR_FULL_DATA[[
        'Random Number ID', 'Cum.T.Gpa', 'Cum.Bcpm.Gpa', 
        'Drop.year', 'Grad.Year', 'Graduated'
    ]].rename(columns={
        'Random Number ID': 'random_id',
        'Cum.T.Gpa': 'cum_total_gpa',
        'Cum.Bcpm.Gpa': 'cum_bcpm_gpa',
        'Drop.year': 'drop_year',
        'Grad.Year': 'grad_year',
        'Graduated': 'graduated'
    })
