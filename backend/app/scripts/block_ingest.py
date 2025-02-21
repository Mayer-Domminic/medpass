import pandas as pd
import numpy as np
import re
from sqlalchemy.exc import IntegrityError
from ..schemas import pydanticstudentinformation as pydantic
from ..schemas import pydanticexamquestion as pydanticexam
from ..schemas import pydanticclassfaculty as pydanticclass
from ..models import studentinformationmodels as studentmodel
from ..models import classfacultymodels as classmodel
from ..models import examquestionmodels as exammodel
from ..core.database import get_db
import os

def extract_subject(text):
        result = re.search(r'Disciplines and Topics/([^%]+)', text)
        return result.group(1).strip() if result else None

#Extracts Year and Block Number 
def process_sheet_name(df, sheet_number):
    sheet_name = list(df.keys())[sheet_number]
    
    match = re.search(r"^(\d{4})\s+Block\s+(\d+)", sheet_name)
    
    if match:
        year, block = match.groups()
    
    return sheet_name, year, block
    
    
def ingest_class():
    class_filePath = os.path.join(
        "app", "scripts", "data", "Class Information.xlsx"
    )
    
    df_class = pd.read_excel(class_filePath, sheet_name=0)
    
    #Import Base Class Information
    db = next(get_db())
    try:
        for _, row in df_class.iterrows():
            try:
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
            except IntegrityError:
                print(f"Class {row['Class Name']} already exists in the database!")
                db.rollback()
            except Exception as e:
                print(f"Error when adding data {e}")
                db.rollback()
                raise
        print('Base Class Data Loaded in Database')    
    except Exception as e:
        print(f"Unexpected Error {e}")
    finally:
        db.close()
        
def process_sheet_data(data):
    number_subjects = len(data.columns[1:]) // 3
    groupavg_indx = data[data.iloc[:, 0] == 'Group Average'].index[0]
    
    topics_data = []
    student_scores = []
    
    for sub_indx in range(number_subjects):
        '''Splits Block Into three sections for subjects'''
        start = 1 + (sub_indx * 3)
        subject_column = data.columns[start:start + 3] 
        
        topic_name = extract_subject(subject_column[0])
        '''Convert to string first to strip % convert back to float after'''
        group_avg = float(str(data.iloc[groupavg_indx, start]).rstrip('%')) * 100
        
        topic_header = {
            'name': topic_name,
            'assessment total': int(data.iloc[0, start]),
            'total items': int(data.iloc[1, start]),
            'group_average': group_avg
        }
        topics_data.append(topic_header)
        
        student_rows = data[data.index > groupavg_indx].copy()
        
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
            
    return topics_data, student_scores

def insert_class_offering(db, block_num, year):
    try:
        class_id = db.query(classmodel.Class.classid).filter(classmodel.Class.block == block_num).first()

        offering_data = pydanticclass.ClassOffering(
            ClassID = int(class_id[0]),
            DateTaught = year
        ) 
        db_offering_data = classmodel.ClassOffering(
            classid = offering_data.ClassID,
            datetaught = offering_data.DateTaught
        )
        db.add(db_offering_data)
        db.commit()
        print(f'Class Offering Data for ClassID: {class_id} for Year: {year} Loaded in Database')
    except IntegrityError:
        print(f"Class Offering with ClassID: {class_id} already exists in the database!")
        db.rollback ()
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise 
       
    return db_offering_data.classofferingid
        
def insert_grade_classifications(db, topics_data, class_offering_id):
    classification_ids = {}
    for subject in topics_data:
        try:
            classification_data = pydanticclass.GradeClassification(
                ClassOfferingID = class_offering_id,
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
            classification_ids[subject['name']] = db_classification_data.gradeclassificationid
                
        except IntegrityError:
            print(f"Grade Classfication with name: {subject['name']} already exists in the database!")
            db.rollback() 
            
        except Exception as e:
            print(f"Error when adding data {e}")
            db.rollback()
            raise
    print(f'Grade Classification Data for: {class_offering_id} Loaded in Database')
        
    return classification_ids

def insert_student_grades(db, student_scores, classification_ids, block):
    for row in student_scores:
        try:
            classification_id = classification_ids.get(row['subject name'])
                    #temp just hard coded grade classification id
            student_data = pydanticclass.StudentGrade(
                StudentID = row['student id'],
                GradeClassificationID = classification_id,
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
        except IntegrityError:
            print(f"Student Grade with already exists for student: {row['student id']} already exists in the database!")
            db.rollback() 
        
        except Exception as e:
            print(f"Error when adding data {e}")
            db.rollback()
            raise
    print(f'Student Grade Data for Block: {block} Loaded in Database')
    

if __name__ == "__main__":
    
    filePath = os.path.join(
        "app", "scripts", "data", "Deidentified Reports (1).xlsx"
    )
    
    df_unrdata = pd.read_excel(filePath, sheet_name=None)
    dropped_sheets = [
        'Full ID List', '2024 Block 1 Block Filters', '2024 Block 2 Block Filters', '2024 Block 3', '2024 Block 4', 
        '2024 Block 5', '2024 Block 6 Block Filters', '2024 Block 6 Category Filters', '2024 Block 7 Block Filters', '2024 Block 7 Category Filters', '2024 Block 8 Block Filters', '2024 Block 8 Category Filters', '2024 Block 9', '2024 Block 10'
    ]
    df_unrdata = {name: df for name, df in df_unrdata.items() if name not in dropped_sheets}
    sheet_names = df_unrdata.keys()
    #Ingesting Base Class Information
    ingest_class()
    
    
    #Ingestion Process Begins
    for i in range(len(sheet_names)):
        sheet_name, year, block = process_sheet_name(df_unrdata, i)
        
        df_current = df_unrdata[sheet_name]
        try:
            db = next(get_db())
            topics_data, student_scores = process_sheet_data(df_current)
            
            class_offering_id = insert_class_offering(db, int(block), int(year))
            
            classification_ids = insert_grade_classifications(db, topics_data, class_offering_id)
            
            insert_student_grades(db, student_scores, classification_ids, block)
            
            print(f"Succesfully process sheet {sheet_name}")
            
        except Exception as e:
            print(f"Error processing sheet {sheet_name}: {e}")
            db.rollback()
        finally:
            db.close()   
        
