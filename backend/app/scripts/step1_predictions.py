from pathlib import Path
import pandas as pd
from sqlalchemy import func
from sklearn.linear_model import LogisticRegression
import json
import joblib
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split, cross_val_score
from imblearn.pipeline import Pipeline
from imblearn.under_sampling import RandomUnderSampler
from sklearn.preprocessing import StandardScaler

from ..core.database import get_db
from ..models.examquestionmodels import Exam
from ..models.studentinformationmodels import ExamResults, Student
from ..models.classfacultymodels import StudentGrade

def safe_divide(numerator, denominator):
    return numerator / denominator if denominator != 0 else 0.0

def generate_predictions():
    db = next(get_db())
    
    step_one = db.query(Exam).filter(Exam.examname == 'Step 1').first()
    if not step_one:
        raise ValueError("Step 1 exam not found")
    
    step_one_results = db.query(ExamResults).filter(ExamResults.examid == step_one.examid).all()

    data = []
    for result in step_one_results:
        student = db.get(Student, result.studentid)
        if not student:
            continue
        
        features = {
            'student_id': student.studentid,
            'cumgpa': student.cumgpa if student.cumgpa is not None else 0.0,
            'bcpmgpa': student.bcpmgpa if student.bcpmgpa is not None else 0.0,
            'mmicalc': student.mmicalc if student.mmicalc is not None else 0.0,
            'passorfail': result.passorfail
        }
        
        grades = db.query(
            func.coalesce(func.sum(StudentGrade.pointsearned), 0).label('total_earned'),
            func.coalesce(func.sum(StudentGrade.pointsavailable), 0).label('total_available')
        ).filter(StudentGrade.studentid == student.studentid).first()
        
        features['avg_grade'] = safe_divide(grades.total_earned, grades.total_available)
        
        prev_exams = db.query(ExamResults).join(Exam).filter(
            ExamResults.studentid == student.studentid,
            Exam.examname != 'Step 1'
        ).all()
        
        valid_scores = [e.score for e in prev_exams if e.score is not None]
        valid_pass = [int(e.passorfail) for e in prev_exams if e.passorfail is not None]
        
        features.update({
            'num_prev_exams': len(prev_exams),
            'avg_prev_score': safe_divide(sum(valid_scores), len(valid_scores)) if valid_scores else 0,
            'prev_pass_rate': safe_divide(sum(valid_pass), len(valid_pass)) if valid_pass else 0
        })
        
        data.append(features)

    df = pd.DataFrame(data).drop_duplicates(subset=['student_id'], keep='last')
    
    df.fillna({
        'cumgpa': 0,
        'bcpmgpa': 0,
        'mmicalc': 0,
        'avg_grade': 0,
        'num_prev_exams': 0,
        'avg_prev_score': 0,
        'prev_pass_rate': 0
    }, inplace=True)
    
    X = df.drop(['passorfail', 'student_id'], axis=1)
    y = df['passorfail']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.3, 
        stratify=y,
        random_state=42
    )
    
    model = Pipeline([
        ('sampler', RandomUnderSampler(random_state=42)),
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(
            class_weight='balanced',
            random_state=42,
            max_iter=1000
        ))
    ])
    
    try:
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
        print(f"Cross-validation scores: {cv_scores}")
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        metrics = {
            "test_accuracy": accuracy_score(y_test, y_pred),
            "test_classification_report": classification_report(y_test, y_pred, output_dict=True),
            "test_confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            "cross_validation": {
                "mean_accuracy": cv_scores.mean(),
                "std_accuracy": cv_scores.std(),
                "scores": cv_scores.tolist()
            }
        }
        
        output_path = Path(__file__).parent.parent / "data" / "predictions"
        output_path.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, output_path / "step1_model.pkl")
        
        with open(output_path / "prediction_metrics.json", "w") as f:
            json.dump(metrics, f)
            
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        raise

if __name__ == "__main__":
    generate_predictions()