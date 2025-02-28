import pandas as pd
import numpy as np
from ..schemas.pydantic_base_models import user_schemas, exam_schemas, misc_schemas, result_schemas
from app.models import Student, ClassRoster, GraduationStatus, ExamResults, LoginInfo, Exam
from ..core.database import get_db, link_logininfo
from ..core.security import get_password_hash
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
        
    df_graduationstatus['Grad.yrs'] = df_graduationstatus['Grad.yrs'].apply(convertGradYear).replace({float('nan'): None})
    df_graduationstatus['Grad.Year'] = df_graduationstatus['Grad.Year'].replace(['Active', 'Dropped'], None)
    df_graduationstatus['Graduated'] = df_graduationstatus['Graduated'].fillna(0).astype(bool)
    
    #print(df_graduationstatus.dtypes)
    #print(df_graduationstatus)

    #Adding Base Exam Name Data
    base_exam_data = {
        'Exam Name': ['MCAT', 'CBSE', 'Step 1', 'Step 2'],
        'Exam Description': ['Medical School Admission Exam', 'Step 1 Readiness Exam', 
                             'Major Medical Exam for Pre-Pratical', 'Major Medical Exam Post-Pratical'],
        'Pass Score': [510, 70, 196, 214]
    }
    
    df_exam_data = pd.DataFrame(base_exam_data)
    #print(df_exam_data)
    
    #Adding Student Exam Data
    df_student_exam = df_unrdata[[
       'Random Number ID',  'MCATcalc', 'CBSE1 score', 'CBSE2 score', 'USMLE_Step1score', 'USMLE_STEP2score'
    ]]
    
    #print(df_student_exam)
    
    
    #Adding Student Data
    try:
        db = next(get_db())
        for _, row in df_student.iterrows():
            student_data = user_schemas.StudentSchema(
                StudentID = row['Random Number ID'],
                CumGPA = row['Cum.T.Gpa'],
                BcpmGPA = row['Cum.Bcpm.Gpa'],
                MMICalc = row['MMIcalc']
            ) 
            db_student = Student(
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
            roster_data = misc_schemas.ClassRoster(
                RosterYear = row['Matric.year'],
                InitialRosterAmount = row['initialRosterAmount'],
                CurrentEnrollment = row['currentEnrollment']
            ) 
            db_roster = ClassRoster(
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
            graduation_data = result_schemas.GraduationStatus(
                StudentID = row['Random Number ID'],
                RosterYear = row['Matric.year'],
                GraduationYear = row['Grad.Year'],
                Graduated = row['Graduated'],
                GraduationLength = row['Grad.yrs'],
                Status = row['Status2024Jan']
            ) 
            db_graduation = GraduationStatus(
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
    
    #Ingesting Exam Data
    try:
        db = next(get_db())
        for _, row in df_exam_data.iterrows():
            exam_data = exam_schemas.Exam(
                ExamName = row['Exam Name'],
                ExamDescription = row['Exam Description'],
                PassScore = row['Pass Score']
            ) 
            db_exam_data = Exam(
                examname = exam_data.ExamName,
                examdescription = exam_data.ExamDescription,
                passscore = exam_data.PassScore
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
    
    
    #Processing Exam Data
    exam_id_dict = {
        'MCATcalc': 1,
        'CBSE1 score': 2,
        'CBSE2 score': 2,
        'USMLE_Step1score': 3,
        'USMLE_STEP2score': 4
    }
    
    exam_name_mapping = {
        'MCATcalc': 'MCAT',
        'CBSE1 score': 'CBSE',
        'CBSE2 score': 'CBSE',
        'USMLE_Step1score': 'Step 1',
        'USMLE_STEP2score': 'Step 2'
    }
    
    exam_columns = ['MCATcalc', ('CBSE1 score', 'CBSE2 score'), 'USMLE_Step1score', 'USMLE_STEP2score']
    processed_student_exam = []
    exam_dict = dict(zip(base_exam_data['Exam Name'], base_exam_data['Pass Score']))
    
    def pass_calculate(score, passScore):
                if score >= passScore:
                    return True
                elif score < passScore:
                    return False
                else:
                    return None
                
    
    for _, row in df_student_exam.iterrows():
        for exam_col in ['MCATcalc', 'USMLE_Step1score', 'USMLE_STEP2score']:
            passScore = exam_dict.get(exam_name_mapping.get(exam_col), None)
            
            if pd.notna(row[exam_col]):
                data = {
                    'studentID': int(row['Random Number ID']),
                    'examID': exam_id_dict[exam_col],
                    'clerkshipID': None,
                    'score': int(row[exam_col]),
                    'passOrFail': pass_calculate(int(row[exam_col]), passScore)
                }
                processed_student_exam.append(data)
        
        if pd.notna(row['CBSE1 score']):
            passScore = exam_dict.get(exam_name_mapping.get('CBSE1 score'), None)
            data = {
                'studentID': int(row['Random Number ID']),
                'examID': exam_id_dict['CBSE1 score'],
                'clerkshipID': None,
                'score': int(row['CBSE1 score']),
                'passOrFail': pass_calculate(int(row['CBSE1 score']), passScore)
            }
            processed_student_exam.append(data)
        
        if pd.notna(row['CBSE2 score']):
            passScore = exam_dict.get(exam_name_mapping.get('CBSE2 score'), None)
            data = {
                'studentID': int(row['Random Number ID']),
                'examID': exam_id_dict['CBSE2 score'],
                'clerkshipID': None,
                'score': int(row['CBSE2 score']),
                'passOrFail': pass_calculate(int(row['CBSE2 score']), passScore)
            }
            processed_student_exam.append(data)
        
    #Ingesting Processed Student Data
    try:
        db = next(get_db())
        for row in processed_student_exam:
            student_exam_data = result_schemas.ExamResults(
                StudentID = row['studentID'],
                ExamID = row['examID'],
                Score = row['score'],
                PassOrFail = row['passOrFail']
            ) 
            db_student_exam_data = ExamResults(
                studentid = student_exam_data.StudentID,
                examid = student_exam_data.ExamID,
                score = student_exam_data.Score,
                passorfail = student_exam_data.PassOrFail     
            )
            db.add(db_student_exam_data)
        db.commit()
        print('Student Exam Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  
    
    #Admin & User Testing Ingest
    hashed_password = get_password_hash('Medpass#1')
    
    login_data = {
    'username': ['mpadmin', 'mpuser'],
    'password': [
        hashed_password,
        hashed_password
    ],
    'isactive': [True, True],
    'issuperuser': [True, False],
    'email': ['amongus@gmail.com', 'amongus@gmail.com']
    }   
    
    df_login_data = pd.DataFrame(login_data)
    try:
        db = next(get_db())
        for _, row in df_login_data.iterrows():
            logininfo_data = user_schemas.LoginInfo(
                Username = row['username'],
                Password = row['password'],
                IsActive = row['isactive'],
                IsSuperUser = row['issuperuser'],
                Email = row['email']
            ) 
            db_logininfo_data = LoginInfo(
                 username = logininfo_data.Username,
                 password = logininfo_data.Password,
                 isactive = logininfo_data.IsActive,
                 issuperuser = logininfo_data.IsSuperUser,
                 email = logininfo_data.Email
            )
            db.add(db_logininfo_data)
        db.commit()
        link_logininfo(298, 11)
        print('Mock Login Info Data Loaded in Database')
        
    except Exception as e:
        print(f"Error when adding data {e}")
        db.rollback()
        raise
    
    finally:
        db.close()  
    
    #print(df_student)
    
    
    