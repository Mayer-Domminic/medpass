import pandas as pd
import numpy as np
from ..models import pydanticstudentinformation as pydantic
from ..models import studentinformationmodels as studentmodel
from ..core.database import create_table, drop_table, get_db
import os

if __name__ == "__main__":
    
    filePath = os.path.join(
        "app", "scripts", "data", "Deidentified Reports (1).xlsx"
    )
    
    df_unrdata = pd.read_excel(filePath, sheet_name=0)
    
    df_unrdata = df_unrdata.drop([
        'Bl1_5av_calc', 'Bl6-10av_calc', 'Bl1-10av_calc',
        'Graduated.4yr', 'Graduated.5yr', 'Graduated.6yr','Graduated.>6yr'
        ], axis='columns')
    
    df_student = df_unrdata[[
        'Random Number ID', 'Cum.T.Gpa', 'Cum.Bcpm.Gpa', 
        'MMIcalc'
    ]]
    
    db = next(get_db())
    
    try:
        for _, row in df_student.iterrows():
            student_data = pydantic.StudentSchema(
                StudentID = row['Random Number ID'],
                CumGPA = row['Cum.T.Gpa'],
                BcpmGPA = row['Cum.Bcpm.Gpa'],
                MMICalc = row['MMIcalc']
            )
            
            db_student = studentmodel.Student(
                studentid = student_data.StudentID,
                cumgpa = student_data.CumGPA,
                bcpmgpa = student_data.BcpmGPA,
                mmicalc = student_data.MMICalc
            )
            
            db.add(db_student)
        
        db.commit()
        print('Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()     
    
    print(df_student)
    
    
    