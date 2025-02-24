from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.ensemble import RandomForestClassifier

# Local imports
from app.core.database import get_db
from app.models import (
    Exam,
    ExamResults,
    Student,
    StudentGrade,
    ClassOffering,
    GradeClassification
)

def generate_predictions():
    db = next(get_db())
    
    # Query Step 1 exam and results
    step_one = db.query(Exam).filter(Exam.examname == 'Step 1').first()
    if not step_one:
        raise ValueError("Step 1 exam not found")
    
    step_one_results = db.query(ExamResults).filter(ExamResults.examid == step_one.examid).all()

    data = []
    for result in step_one_results:
        student = db.query(Student).get(result.studentid)
        
        # Student features
        features = {
            'student_id': student.studentid,
            'cumgpa': student.cumgpa,
            'bcpmgpa': student.bcpmgpa,
            'mmicalc': student.mmicalc,
            'passorfail': result.passorfail
        }
        
        # Calculate average grade
        grades = db.query(
            func.sum(StudentGrade.pointsearned).label('total_earned'),
            func.sum(StudentGrade.pointsavailable).label('total_available')
        ).filter(StudentGrade.studentid == student.studentid).first()
        
        features['avg_grade'] = grades.total_earned / grades.total_available if grades.total_available > 0 else 0
        
        # Previous exam performance
        prev_exams = db.query(ExamResults).join(Exam).filter(
            ExamResults.studentid == student.studentid,
            Exam.examname != 'Step 1'
        ).all()
        
        features['num_prev_exams'] = len(prev_exams)
        features['avg_prev_score'] = sum(e.score for e in prev_exams) / len(prev_exams) if prev_exams else 0
        features['prev_pass_rate'] = sum(e.passorfail for e in prev_exams) / len(prev_exams) if prev_exams else 0
        
        data.append(features)

    df = pd.DataFrame(data)
    
    # Train model
    X = df.drop(['passorfail', 'student_id'], axis=1)
    y = df['passorfail']
    
    model = RandomForestClassifier(class_weight='balanced')
    model.fit(X, y)
    
    # Save predictions
    df['predicted_passorfail'] = model.predict(X)
    
    # Ensure directory exists
    output_path = Path(__file__).parent.parent / "data" / "predictions"
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save to JSON
    df[['student_id', 'predicted_passorfail']].to_json(
        output_path / "student_predictions.json",
        orient='records'
    )

if __name__ == "__main__":
    generate_predictions()