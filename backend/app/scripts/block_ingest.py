import pandas as pd
import numpy as np
import re
from ..schemas import pydanticstudentinformation as pydantic
from ..schemas import pydanticexamquestion as pydanticexam
from ..schemas import pydanticclassfaculty as pydanticclass
from ..models import studentinformationmodels as studentmodel
from ..models import classfacultymodels as classmodel
from ..models import examquestionmodels as exammodel
from ..core.database import get_db
import os

if __name__ == "__main__":
    
    filePath = os.path.join(
        "app", "scripts", "data", "Deidentified Reports (1).xlsx"
    )
    
    class_filePath = os.path.join(
        "app", "scripts", "data", "Class Information.xlsx"
    )
    
    df_class = pd.read_excel(class_filePath, sheet_name=0)
    
    df_unrdata = pd.read_excel(filePath, sheet_name=6)
    
    #Import Base Class Information
    try:
        db = next(get_db())
        for _, row in df_class.iterrows():
            class_data = pydanticclass.ClassModel(
                ClassID = row['Class ID'],
                ClassName = row['Class Name'],
                ClassDescription = row['Description'],
                Block = row['Block']
            ) 
            db_class_data = classmodel.Class(
                classid = class_data.ClassID,
                classname = class_data.ClassName,
                classdescription = class_data.ClassDescription,
                block = class_data.Block
            )
            db.add(db_class_data)
        db.commit()
        print('Base Class Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  
    
    number_subjects = len(df_unrdata.columns[1:]) // 3
    groupavg_indx = df_unrdata[df_unrdata.iloc[:, 0] == 'Group Average'].index[0]
    
    print(f'Number of subjects for block{number_subjects}')
    
    def extract_subject(text):
        result = re.search(r'Disciplines and Topics/([^%]+)', text)
        return result.group(1).strip() if result else None
    
    topics_data = []
    student_scores = []
    
    for sub_indx in range(number_subjects):
        '''Splits Block Into three sections for subjects'''
        start = 1 + (sub_indx * 3)
        subject_column = df_unrdata.columns[start:start + 3] 
        
        topic_name = extract_subject(subject_column[0])
        '''Convert to string first to strip % convert back to float after'''
        group_avg = float(str(df_unrdata.iloc[groupavg_indx, start]).rstrip('%')) * 100
        
        data = {
            'name': topic_name,
            'assessment total': int(df_unrdata.iloc[0, start]),
            'total items': int(df_unrdata.iloc[1, start]),
            'group_average': group_avg
        }
        topics_data.append(data)
        
        student_rows = df_unrdata[df_unrdata.index > groupavg_indx].copy()
        
        for _, row in student_rows.iterrows():
            try:
                score = {
                    'student id': row.iloc[0],
                    'subject name': topic_name,
                    'percentage': float(str(row.iloc[start]).rstrip('%')) * 100,
                    'points achieved': float(row.iloc[start + 1]),
                    'points available': float(row.iloc[start + 2])
                }
                student_scores.append(score)
            except (ValueError, TypeError) as e:
                print(f"Can not process score for studentID: {row.iloc[0]} in subject {topic_name}: {e}")
                continue
            
            
    #print(topics_data)
    #print(student_scores)