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
    drop_year_map = {
        '1st': 1,
        '2nd': 2,
        '3rd': 3,
        '4th': 4,
        '5th': 5,
        np.nan: None,
        'Dropped': None 
    }

    def clean_drop_year(value):
        if pd.isna(value):
            return None
        value_str = str(value).strip()
        return drop_year_map.get(value_str, None)

    def clean_grad_year(value, has_drop_year):
        if has_drop_year:
            return None 
        if pd.isna(value):
            return None
        try:
            year = int(float(value))
            if 2000 <= year <= 2030:
                return year
            return None
        except (ValueError, TypeError):
            return None

    STUDENT['drop_year'] = STUDENT['drop_year'].apply(clean_drop_year)
    STUDENT['grad_year'] = STUDENT.apply(
        lambda row: clean_grad_year(row['grad_year'], row['drop_year'] is not None), 
        axis=1
    )
    
    STUDENT['graduated'] = STUDENT['grad_year'].notna()
    STUDENT['random_id'] = STUDENT['random_id'].astype(str)

    print("Sample of processed data:")
    print(STUDENT.head())
    print("\nChecking processed values:")
    print("Drop year unique values:", sorted([x for x in STUDENT['drop_year'].unique() if x is not None]))
    print("Grad year unique values:", sorted([x for x in STUDENT['grad_year'].unique() if x is not None]))
    print("\nSample of dropped students:")
    print(STUDENT[STUDENT['drop_year'].notna()][['random_id', 'drop_year', 'grad_year', 'graduated']].head())
    
    print("\nConverting data to SQLAlchemy models...")
    student_data = STUDENT.replace({np.nan: None}).to_dict(orient='records')

    students = [Student(**{
        **data,
        'net_id': None
    }) for data in student_data]

    students[649].net_id = 'domminicm'
    print(f"Verifying student 649: {students[649].net_id}")
    #students[650].net_id = 'rinod'
    #students[651].net_id = 'nolanv'
    #students[652].net_id = 'jherweg'

    print("Before inserting students:")
    for s in students[:5]:
        print(f"random_id: {s.random_id}, net_id: {s.net_id}")

    target_student = next((s for s in students if s.random_id == "691"), None)
    if target_student:
        target_student.net_id = 'domminicm'
        print(f"Set net_id for student with random_id 691: {target_student.net_id}")
    else:
        print("Could not find student with random_id 691")

    def bulk_insert_students(students, reset=True):
        db = next(get_db())
        try:
            if reset:
                print("Clearing existing records from students table...")
                db.query(Student).delete()
                db.commit()
                print("Table cleared successfully")

            db.bulk_save_objects(students)
            db.commit()
            print(f"Successfully inserted {len(students)} students")
            
            # Add this debug statement
            test_student = db.query(Student).filter(Student.net_id == 'domminicm').first()
            print(f"Verification - Student with net_id 'domminicm': {test_student}")
            if test_student:
                print(f"Details: {test_student.random_id}, {test_student.net_id}")
        except Exception as e:
            db.rollback()
            print(f"Error during bulk insert: {str(e)}")
            raise e
        finally:
            db.close()

    bulk_insert_students(students, reset=True)
