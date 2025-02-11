import pandas as pd
import numpy as np
from ..models import pydanticstudentinformation as pydantic
from ..models import pydanticexamquestion as pydanticexam
from ..models import studentinformationmodels as studentmodel
from ..models import examquestionmodels as exammodel
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
    
    #Creating Student List
    df_student = df_unrdata[[
        'Random Number ID', 'Cum.T.Gpa', 'Cum.Bcpm.Gpa', 
        'MMIcalc'
    ]]
    
    #Creating Class Roster List
    df_classroster = df_unrdata[[
        'Matric.year', 'Grad.Year'
    ]]
    
    df_initial_roster = (
        df_classroster['Matric.year'].value_counts().sort_index().reset_index().rename(
            columns={
                'count': 'initialRosterAmount'
            }))
    
    df_active = (df_classroster[df_classroster['Grad.Year'] == 'Active']
                 ['Matric.year'].value_counts().sort_index().reset_index().rename(
                     columns={
                         'count': 'currentEnrollment'
                     }))
    
    df_classroster = pd.merge(df_initial_roster, df_active, on= 'Matric.year', how='left').fillna(0)
    df_classroster['currentEnrollment'] = df_classroster['currentEnrollment'].astype(int)
    df_classroster['Matric.year'] = df_classroster['Matric.year'].astype(int)
    
    #Creating Graduation Status Frame
    
    #Status 2024Jan isn't ideal but basing it on avaialable data
    df_graduationstatus = df_unrdata[[
        'Random Number ID', 'Matric.year', 'Grad.Year', 'Graduated', 'Grad.yrs', 'Status2024Jan'
    ]]
    
    def convertGradYear(string):
        if pd.isna(string) or string == 'Active':
            return None
        
        try:
            return int(string.split('.')[1].split('-')[0])
        except:
            return None
    
    #To Prevent Panda View/Copy Errors
    df_graduationstatus = df_graduationstatus.copy()
        
    df_graduationstatus.loc['Grad.yrs'] = df_graduationstatus['Grad.yrs'].apply(convertGradYear).replace({float('nan'): None})
    df_graduationstatus.loc['Grad.Year'] = df_graduationstatus['Grad.Year'].replace(['Active', 'Dropped'], None)
    df_graduationstatus.loc['Graduated'] = df_graduationstatus['Graduated'].fillna(0).astype(bool)
    
    #print(df_graduationstatus.dtypes)
    print(df_graduationstatus)

    #Adding Base Exam Name Data
    base_exam_data = {
        'Exam Name': ['MCAT', 'CBSE', 'Step 1', 'Step 2'],
        'Exam Description': ['Medical School Admission Exam', 'Step 1 Readiness Exam', 
                             'Major Medical Exam for Pre-Pratical', 'Major Medical Exam Post-Pratical']
    }
    
    df_exam_data = pd.DataFrame(base_exam_data)
    print(df_exam_data)
    
    #Adding Student Exam Data
    '''
    #Adding Student Data
    try:
        db = next(get_db())
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
        print('Student Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()    
    
    
    
    #Ingesting ClassRoster List
    try:
        db = next(get_db())
        for _, row in df_classroster.iterrows():
            roster_data = pydantic.ClassRoster(
                RosterYear = row['Matric.year'],
                InitialRosterAmount = row['initialRosterAmount'],
                CurrentEnrollment = row['currentEnrollment']
            ) 
            db_roster = studentmodel.ClassRoster(
                rosteryear = roster_data.RosterYear,
                initialrosteramount = roster_data.InitialRosterAmount,
                currentenrollment = roster_data.CurrentEnrollment
            )
            db.add(db_roster)
        db.commit()
        print('Class Roster Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()   
    
    
    # ingesting graduation status
    try:
        db = next(get_db())
        for _, row in df_graduationstatus.iterrows():
            graduation_data = pydantic.GraduationStatus(
                StudentID = row['Random Number ID'],
                RosterYear = row['Matric.year'],
                GraduationYear = row['Grad.Year'],
                Graduated = row['Graduated'],
                GraduationLength = row['Grad.yrs'],
                Status = row['Status2024Jan']
            ) 
            db_graduation = studentmodel.GraduationStatus(
                studentid = graduation_data.StudentID,
                rosteryear = graduation_data.RosterYear,
                graduationyear = graduation_data.GraduationYear,
                graduated = graduation_data.Graduated,
                graduationlength = graduation_data.GraduationLength,
                status = graduation_data.Status
            )
            db.add(db_graduation)
        db.commit()
        print('Graduation Status Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  
    '''
    #Ingesting Exam Data
    try:
        db = next(get_db())
        for _, row in df_exam_data.iterrows():
            exam_data = pydanticexam.Exam(
                ExamName = row['Exam Name'],
                ExamDescription = row['Exam Description']
            ) 
            db_exam_data = exammodel.Exam(
                examname = exam_data.ExamName,
                examdescription = exam_data.ExamDescription
            )
            db.add(db_exam_data)
        db.commit()
        print('Exam Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  
        
    #print(df_student)
    
    
    