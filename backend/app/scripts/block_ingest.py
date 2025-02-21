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
    #Ingesting GradeOffering with a Block Number temp hard coded
    
    try:
        db = next(get_db())
        block_num = 1
        class_id = db.query(classmodel.Class.classid).filter(classmodel.Class.block == block_num).first()
            #Temp Will Regex Date 
        offering_data = pydanticclass.ClassOffering(
            ClassID = int(class_id[0]),
            DateTaught = 2024
        ) 
        db_offering_data = classmodel.ClassOffering(
            classid = offering_data.ClassID,
            datetaught = offering_data.DateTaught
        )
        db.add(db_offering_data)
        db.commit()
        print('Base Class Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    finally:
        db.close()  
        
    #Temp Ingestion of Grade Classification
    try:
        db = next(get_db())
        #Class offering is temp hard coded
        for subject in topics_data:
            classification_data = pydanticclass.GradeClassification(
                ClassOfferingID = 1,
                ClassificationName = subject['name'],
                UnitType = 'Assessment'
            ) 
            db_classification_data = classmodel.GradeClassification(
                classofferingid = classification_data.ClassOfferingID,
                classificationname = classification_data.ClassificationName,
                unittype = classification_data.UnitType
            )
            db.add(db_classification_data)
        db.commit()
        print('Grade Classification Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    finally:
        db.close()  
        
    #Ingesting All Student Grades
    try:
        db = next(get_db())
        for subject in topics_data:
            classificationid = db.query(classmodel.GradeClassification.gradeclassificationid).filter(classmodel.GradeClassification.classificationname == subject['name']).first()
            for row in student_scores:
                #temp just hard coded grade classification id
                student_data = pydanticclass.StudentGrade(
                    StudentID = row['student id'],
                    GradeClassificationID = int(classificationid[0]),
                    PointsEarned = row['points achieved'],
                    PointsAvailable = row['points available']
                ) 
                db_student_data = classmodel.StudentGrade(
                    studentid = student_data.StudentID,
                    gradeclassificationid = student_data.GradeClassificationID, 
                    pointsearned = student_data.PointsEarned,
                    pointsavailable = student_data.PointsAvailable
                )
                db.add(db_student_data)
        db.commit()
        print('Student Block Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  

            
    #print(topics_data)
    #print(student_scores)