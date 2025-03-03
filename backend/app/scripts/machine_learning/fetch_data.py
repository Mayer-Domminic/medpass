import os
import json
import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Student, GraduationStatus, Exam, ExamResults, GradeClassification, StudentGrade, ClassOffering
from app.api.v1.endpoints.report import (
    generateStudentInformationReport, 
    generateExamReport, 
    generateGradeReport
)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def collect_student_data(specific_student_id=None):
    """
    Collect student data for all students or a specific student ID.
    Saves the data as CSV files and a combined JSON.
    Fixed to be compatible with Pydantic v2.
    
    Args:
        specific_student_id (int, optional): If provided, only collect data for this student ID.
    """
    db = SessionLocal()
    
    try:
        if specific_student_id:
            student_ids = [specific_student_id]
        else:
            student_ids = [id[0] for id in db.query(Student.studentid).all()]
        
        print(f"Found {len(student_ids)} students to process")
        
        all_students_df = pd.DataFrame()
        all_exams_df = pd.DataFrame()
        all_grades_df = pd.DataFrame()
        all_data = []
        
        for i, student_id in enumerate(student_ids):
            print(f"Processing student {i+1}/{len(student_ids)}: ID {student_id}")
            
            try:
                # THANKS RINO!
                student_info = generateStudentInformationReport(student_id, db)
                exams = generateExamReport(student_id, db) or []
                grades = generateGradeReport(student_id, db) or []
                
                try:
                    student_dict = student_info.model_dump() if student_info else {}
                    exams_dict = [exam.model_dump() for exam in exams]
                    grades_dict = [grade.model_dump() for grade in grades]
                except AttributeError:
                    student_dict = student_info.dict() if student_info else {}
                    exams_dict = [exam.dict() for exam in exams]
                    grades_dict = [grade.dict() for grade in grades]
                # TODO weird pydantic issue, still working out a fix
                
                student_record = {
                    "StudentInfo": student_dict,
                    "Exams": exams_dict,
                    "Grades": grades_dict
                }
                
                all_data.append(student_record)
                
                if student_dict:
                    student_df = pd.DataFrame([student_dict])
                    if 'StudentID' not in student_df.columns:
                        student_df['StudentID'] = student_id
                    
                    if all_students_df.empty:
                        all_students_df = student_df.copy()
                    else:
                        all_students_df = pd.concat([all_students_df, student_df], ignore_index=True)
                
                if exams_dict:
                    if exams_dict:
                        exams_df = pd.DataFrame(exams_dict)
                        # Add student ID to link records
                        exams_df['StudentID'] = student_id
                        
                        if all_exams_df.empty:
                            all_exams_df = exams_df.copy()
                        else:
                            all_exams_df = pd.concat([all_exams_df, exams_df], ignore_index=True)
                
                if grades_dict:
                    if grades_dict:
                        grades_df = pd.DataFrame(grades_dict)
                        # Add student ID to link records
                        grades_df['StudentID'] = student_id
                        
                        if all_grades_df.empty:
                            all_grades_df = grades_df.copy()
                        else:
                            all_grades_df = pd.concat([all_grades_df, grades_df], ignore_index=True)
                
            except Exception as e:
                print(f"Error processing student {student_id}: {str(e)}")
                db.rollback()
                continue
    
    except Exception as e:
        print(f"Error in data collection: {str(e)}")
        db.close()
        raise
    
    finally:
        db.close()
    
    if not all_students_df.empty:
        all_students_df.to_csv(os.path.join(DATA_DIR, "all_students.csv"), index=False)
        print(f"Saved student data: {len(all_students_df)} records")
    
    if not all_exams_df.empty:
        all_exams_df.to_csv(os.path.join(DATA_DIR, "all_exams.csv"), index=False)
        print(f"Saved exam data: {len(all_exams_df)} records")
    
    if not all_grades_df.empty:
        all_grades_df.to_csv(os.path.join(DATA_DIR, "all_grades.csv"), index=False)
        print(f"Saved grade data: {len(all_grades_df)} records")
    
    with open(os.path.join(DATA_DIR, "all_students_data.json"), 'w') as f:
        json.dump(all_data, f, indent=2, default=str)
    
    print(f"Data collection complete. Files saved to {DATA_DIR}")
    
    return {
        "students": all_students_df,
        "exams": all_exams_df,
        "grades": all_grades_df
    }

def get_graduated_student_ids():
    """Returns a list of student IDs that have graduated."""
    db = SessionLocal()
    try:
        graduated_ids = [
            id[0] for id in db.query(Student.studentid)
            .join(GraduationStatus, Student.studentid == GraduationStatus.studentid)
            .filter(GraduationStatus.graduated == True)
            .all()
        ]
        return graduated_ids
    finally:
        db.close()
        print('done')

def get_non_graduated_student_ids():
    """Returns a list of student IDs that have not graduated."""
    db = SessionLocal()
    try:
        non_graduated_ids = [
            id[0] for id in db.query(Student.studentid)
            .join(GraduationStatus, Student.studentid == GraduationStatus.studentid)
            .filter(GraduationStatus.graduated == False)
            .all()
        ]
        return non_graduated_ids
    finally:
        db.close()
        print('done')

if __name__ == "__main__":
    results = collect_student_data()
    
    if 'students' in results and not results['students'].empty:
        print("\nStudent info sample:")
        print(results['students'].head())
    
    if 'exams' in results and not results['exams'].empty:
        print("\nExams sample:")
        print(results['exams'].head())
    
    if 'grades' in results and not results['grades'].empty:
        print("\nGrades sample:")
        print(results['grades'].head())
    
    print("\nGraduated student IDs:")
    graduated_ids = get_graduated_student_ids()
    print(f"Found {len(graduated_ids)} graduated students")
    print(graduated_ids[:5] if len(graduated_ids) > 5 else graduated_ids)
    
    print("\nNon-graduated student IDs:")
    non_graduated_ids = get_non_graduated_student_ids()
    print(f"Found {len(non_graduated_ids)} non-graduated students")
    print(non_graduated_ids[:5] if len(non_graduated_ids) > 5 else non_graduated_ids)