from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import json
import pickle
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from app.core.security import get_current_active_user
from app.models import LoginInfo as User


from ....schemas.wrisks import RiskAssessmentResponse, StrengthWeakness, MLPrediction
from ....core.database import get_db
from app.models import Student, GraduationStatus, Exam, ExamResults, GradeClassification, StudentGrade
from app.api.v1.endpoints.report import (
    generateStudentInformationReport, 
    generateExamReport, 
    generateGradeReport
)

# Define paths to ML assets
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DIR = BASE_DIR / "scripts" / "machine_learning"
DATA_DIR = ML_DIR / "data"
MODEL_DIR = DATA_DIR / "model"

# Load student data for reference
try:
    with open(DATA_DIR / "all_students_data.json", "r") as f:
        ALL_STUDENTS_DATA = json.load(f)
except Exception as e:
    print(f"Error loading student data: {str(e)}")
    ALL_STUDENTS_DATA = []

# Load prediction data for non-graduated students
try:
    PREDICTIONS_PATH = MODEL_DIR / "final_predictions.csv"
    if PREDICTIONS_PATH.exists():
        PREDICTIONS_DF = pd.read_csv(PREDICTIONS_PATH)
    else:
        PREDICTIONS_DF = pd.DataFrame()
except Exception as e:
    print(f"Error loading predictions: {str(e)}")
    PREDICTIONS_DF = pd.DataFrame()

# Load the ML model and preprocessor
try:
    with open(MODEL_DIR / "best_model.pkl", "rb") as f:
        MODEL = pickle.load(f)
    
    with open(MODEL_DIR / "preprocessor.pkl", "rb") as f:
        PREPROCESSOR = pickle.load(f)
    
    # Load model evaluation for reference
    with open(MODEL_DIR / "model_evaluation.json", "r") as f:
        MODEL_EVAL = json.load(f)
    
    ML_LOADED = True
except Exception as e:
    print(f"Error loading ML model: {str(e)}")
    MODEL = None
    PREPROCESSOR = None
    MODEL_EVAL = {"best_model": "", "accuracy": 0}
    ML_LOADED = False

router = APIRouter()

def get_student_from_json(student_id: int) -> Optional[Dict]:
    """
    Retrieve student data from the pre-loaded JSON file.
    """
    try:
        for student_data in ALL_STUDENTS_DATA:
            if student_data.get("StudentInfo", {}).get("StudentID") == student_id:
                return student_data
    except Exception as e:
        print(f"Error retrieving student from JSON: {str(e)}")
    return None

def get_cached_prediction(student_id: int) -> Optional[Dict]:
    """
    Get prediction from pre-computed predictions CSV.
    """
    try:
        if PREDICTIONS_DF.empty:
            return None
        
        student_prediction = PREDICTIONS_DF[PREDICTIONS_DF["StudentID"] == student_id]
        if student_prediction.empty:
            return None
        
        # Get the prediction from the best model
        best_model = MODEL_EVAL.get("best_model", "").replace(" ", "_")
        
        prediction_col = f"{best_model}_Prediction"
        probability_col = f"{best_model}_Probability"
        
        if prediction_col not in student_prediction.columns:
            return None
        
        prediction = int(student_prediction[prediction_col].iloc[0])
        probability = float(student_prediction[probability_col].iloc[0]) if probability_col in student_prediction.columns else 0.5
        
        return {
            "prediction": prediction,
            "probability": probability
        }
    except Exception as e:
        print(f"Error getting cached prediction: {str(e)}")
        return None

def calculate_strengths_weaknesses(
    exams: List[Dict], 
    grades: List[Dict]
) -> Tuple[List[StrengthWeakness], List[StrengthWeakness]]:
    """
    Calculate strengths and weaknesses based on exam scores and grades.
    Uses data from the report generation rather than querying the database.
    """
    try:
        strengths = []
        weaknesses = []
        
        # Process exams
        exam_performance = {}
        for exam in exams:
            exam_name = exam.get("ExamName", "Unknown")
            score = exam.get("Score", 0)
            pass_score = exam.get("PassScore", 0)
            passed = exam.get("PassOrFail", False)
            
            # Calculate performance percentage if possible
            if pass_score > 0:
                performance = (score / pass_score) * 100
            else:
                performance = 100 if passed else 0
            
            exam_performance[exam_name] = performance
            
            # Classify as strength or weakness
            if passed and performance >= 110:  # Significantly above passing score
                strengths.append(StrengthWeakness(
                    subject=exam_name,
                    unit_type="Exam",
                    performance_score=performance
                ))
            elif not passed:
                weaknesses.append(StrengthWeakness(
                    subject=exam_name,
                    unit_type="Exam",
                    performance_score=performance
                ))
        
        # Process grades by subject
        subject_performance = {}
        for grade in grades:
            subject = grade.get("ClassificationName", "Unknown")
            points_earned = grade.get("PointsEarned", 0)
            points_available = grade.get("PointsAvailable", 0)
            
            if subject not in subject_performance:
                subject_performance[subject] = {
                    "total_earned": 0,
                    "total_available": 0
                }
            
            subject_performance[subject]["total_earned"] += points_earned
            subject_performance[subject]["total_available"] += points_available
        
        # Calculate performance percentages and classify
        for subject, data in subject_performance.items():
            if data["total_available"] == 0:
                continue
                
            performance = (data["total_earned"] / data["total_available"]) * 100
            
            if performance >= 85:
                strengths.append(StrengthWeakness(
                    subject=subject,
                    unit_type="Course",
                    performance_score=performance
                ))
            elif performance < 70:
                weaknesses.append(StrengthWeakness(
                    subject=subject,
                    unit_type="Course",
                    performance_score=performance
                ))
        
        # Sort by performance score
        strengths.sort(key=lambda x: x.performance_score, reverse=True)
        weaknesses.sort(key=lambda x: x.performance_score)
        
        return strengths, weaknesses
    except Exception as e:
        print(f"Error calculating strengths/weaknesses: {str(e)}")
        return [], []

def predict_graduation_risk(student_data: Dict) -> MLPrediction:
    """
    Predicts graduation risk for a student using the trained ML model.
    
    This function handles several scenarios:
    1. If no ML model is loaded, returns a prediction with error status
    2. If a cached prediction exists for the student ID, returns that prediction
    3. Otherwise, prepares student data features and generates a new prediction
    
    The function ensures proper handling of missing grade features by adding them
    as NaN values to match the expected structure during model training. This is 
    necessary because the preprocessor was trained with these columns missing or NaN.
    
    Args:
        student_data (Dict): Dictionary containing student information, exam results, 
                            and grade data
    
    Returns:
        MLPrediction: Contains prediction result (1=on-time, 0=delayed graduation), 
                     probability, descriptive text, and confidence score
    """
    try:
        if not ML_LOADED:
            return MLPrediction(
                prediction=-1,
                probability=0.0,
                prediction_text="ML model not available",
                confidence_score=0.0
            )
        
        student_id = student_data.get("StudentInfo", {}).get("StudentID")
        cached_prediction = get_cached_prediction(student_id)
        
        if cached_prediction:
            prediction = cached_prediction["prediction"]
            probability = cached_prediction["probability"]
            return MLPrediction(
                prediction=prediction,
                probability=probability,
                prediction_text="On-time graduation likely" if prediction == 1 else "Delayed graduation possible",
                confidence_score=probability * 100
            )
        
        student_info = student_data.get("StudentInfo", {})
        exams = student_data.get("Exams", [])
        
        student_df = pd.DataFrame([student_info])
        
        if exams:
            exams_df = pd.DataFrame(exams)
            exams_df['StudentID'] = student_id
            
            agg_dict = {
                'Score': ['mean', 'min', 'max', 'std', 'count']
            }
            
            if 'PassOrFail' in exams_df.columns:
                agg_dict['PassOrFail'] = ['mean', 'sum']
                
            exam_stats = exams_df.groupby('StudentID').agg(agg_dict)
            exam_stats.columns = ['_'.join(col).strip() for col in exam_stats.columns.values]
            exam_stats.reset_index(inplace=True)
            
            student_df = pd.merge(student_df, exam_stats, on='StudentID', how='left')
        
        for column in [
            'Percentage_mean', 'Percentage_min', 'Percentage_max', 'Percentage_std',
            'Percentage_count', 'PointsEarned_sum', 'PointsAvailable_sum', 'Overall_Percentage'
        ]:
            if column not in student_df.columns:
                student_df[column] = np.nan
        
        features_to_drop = ['Graduated', 'GraduationLength', 'GraduationYear', 'Status', 'StudentID', 'OnTime']
        X = student_df.drop(columns=[col for col in features_to_drop if col in student_df.columns], errors='ignore')
        
        try:
            X_processed = PREPROCESSOR.transform(X)
            prediction = int(MODEL.predict(X_processed)[0])
            probability = float(MODEL.predict_proba(X_processed)[0][1])
            
            return MLPrediction(
                prediction=prediction,
                probability=probability,
                prediction_text="On-time graduation likely" if prediction == 1 else "Delayed graduation possible",
                confidence_score=probability * 100
            )
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            return MLPrediction(
                prediction=-1,
                probability=0.0,
                prediction_text=f"Error: {str(e)}",
                confidence_score=0.0
            )
    except Exception as e:
        print(f"General error in predict_graduation_risk: {str(e)}")
        return MLPrediction(
            prediction=-1,
            probability=0.0,
            prediction_text="Error during prediction processing",
            confidence_score=0.0
        )

def calculate_overall_risk_score(ml_prediction: MLPrediction, grades: List[Dict], exams: List[Dict]) -> float:
    """
    Calculate an overall risk score combining ML prediction and academic performance.
    Lower score = higher risk
    """
    try:
        # Start with base score from ML prediction
        if ml_prediction.prediction == 1:  # Predicted to graduate on time
            base_score = 80 + (ml_prediction.confidence_score * 0.2)  # Range: 80-100
        elif ml_prediction.prediction == 0:  # Predicted to graduate late
            base_score = 40 + (ml_prediction.confidence_score * 0.4)  # Range: 40-80
        else:  # ML model unavailable or error
            base_score = 50  # Neutral starting point
        
        # Adjust based on exam performance
        exam_pass_ratio = 0
        if exams:
            passed_exams = sum(1 for exam in exams if exam.get("PassOrFail", False))
            exam_pass_ratio = passed_exams / len(exams)
            
            # Adjust score based on exam performance
            if exam_pass_ratio < 0.5:
                base_score -= 30  # High risk if failing most exams
            elif exam_pass_ratio < 0.8:
                base_score -= 15  # Moderate risk
            else:
                base_score += 5   # Low risk if passing most exams
        
        # Adjust based on grade performance
        if grades:
            total_earned = sum(grade.get("PointsEarned", 0) for grade in grades)
            total_available = sum(grade.get("PointsAvailable", 0) for grade in grades)
            
            if total_available > 0:
                grade_performance = (total_earned / total_available) * 100
                
                if grade_performance < 70:
                    base_score -= 20
                elif grade_performance < 80:
                    base_score -= 10
                elif grade_performance >= 90:
                    base_score += 10
        
        # Ensure score is in range 0-100
        return max(0, min(100, base_score))
    except Exception as e:
        print(f"Error calculating risk score: {str(e)}")
        return 50  # Return a neutral score on error

def convert_model_to_dict(model: Any) -> Dict:
    """
    Helper function to safely convert Pydantic models to dictionaries.
    Works with both Pydantic v1 and v2.
    """
    if model is None:
        return {}
        
    try:
        # Try Pydantic v2 method first
        if hasattr(model, 'model_dump'):
            return model.model_dump()
        # Fall back to v1 method
        elif hasattr(model, 'dict'):
            return model.dict()
        # If it's already a dict, return it
        elif isinstance(model, dict):
            return model
        # Otherwise, try to convert to dict using __dict__
        else:
            return {k: v for k, v in model.__dict__.items() if not k.startswith('_')}
    except Exception as e:
        print(f"Error converting model to dict: {str(e)}")
        return {}

def convert_models_to_dicts(models: List[Any]) -> List[Dict]:
    """
    Helper function to safely convert a list of Pydantic models to dictionaries.
    multiple...
    """
    if not models:
        return []
        
    try:
        return [convert_model_to_dict(model) for model in models]
    except Exception as e:
        print(f"Error converting models to dicts: {str(e)}")
        return []

@router.get("/risk", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get risk assessment for a student based on ML model prediction and academic performance.
    Includes strengths and weaknesses analysis.
    """
    try:
        # Try to get student data from pre-loaded JSON first
        student_id = db.query(Student).filter(Student.logininfoid == current_user.logininfoid).first()
        student_id = student_id.studentid
        student_data = get_student_from_json(student_id)
        
        # If not found, check if student exists in database
        if not student_data:
            # First check if student exists by querying the database directly
            student = db.query(Student).filter(Student.studentid == student_id).first()
            if not student:
                raise HTTPException(
                    status_code=404,
                    detail="Student data not found"
                )
            
            # If student exists, generate report data
            try:
                student_info = generateStudentInformationReport(student_id, db)
                exams = generateExamReport(student_id, db) or []
                grades = generateGradeReport(student_id, db) or []
                
                # Convert to dictionaries using the helper functions
                student_dict = convert_model_to_dict(student_info)
                exams_dict = convert_models_to_dicts(exams)
                grades_dict = convert_models_to_dicts(grades)
                
                student_data = {
                    "StudentInfo": student_dict,
                    "Exams": exams_dict,
                    "Grades": grades_dict
                }
            except Exception as e:
                print(f"Error generating student report: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating student report: {str(e)}"
                )
        
        if not student_data or not student_data.get("StudentInfo"):
            raise HTTPException(
                status_code=404,
                detail="Student data not found"
            )
        
        # Extract data components
        student_info = student_data.get("StudentInfo", {})
        exams = student_data.get("Exams", [])
        grades = student_data.get("Grades", [])
        
        # Calculate ML prediction
        ml_prediction = predict_graduation_risk(student_data)
        
        # Calculate strengths and weaknesses
        strengths, weaknesses = calculate_strengths_weaknesses(exams, grades)
        
        # Calculate overall risk score
        risk_score = calculate_overall_risk_score(ml_prediction, grades, exams)
        
        # Determine risk level
        risk_level = "High" if risk_score < 50 else "Medium" if risk_score < 75 else "Low"
        
        # Prepare details for the response
        details = {
            "student_name": f"{student_info.get('FirstName', '')} {student_info.get('LastName', '')}".strip(),
            "total_exams": len(exams),
            "passed_exams": sum(1 for exam in exams if exam.get("PassOrFail", False)),
            "total_grades": len(grades),
            "ml_model_accuracy": MODEL_EVAL.get(MODEL_EVAL.get("best_model", ""), {}).get("accuracy", 0) if ML_LOADED else 0
        }
        
        return RiskAssessmentResponse(
            risk_score=risk_score,
            risk_level=risk_level,
            strengths=strengths,
            weaknesses=weaknesses,
            ml_prediction=ml_prediction,
            details=details
        )
    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status codes
        raise
    except Exception as e:
        print(f"Unexpected error in risk assessment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )



@router.get("/prediction", response_model=MLPrediction)
async def get_graduation_prediction(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get ML model prediction for a student's graduation outcome.
    """
    try:
        # Try to get student data from pre-loaded JSON first
        student_data = get_student_from_json(student_id)
        
        # If not found, check if student exists in database
        if not student_data:
            # First check if student exists by querying the database directly
            student = db.query(Student).filter(Student.studentid == student_id).first()
            if not student:
                raise HTTPException(
                    status_code=404,
                    detail="Student data not found"
                )
            
            # If student exists, generate report data
            try:
                student_info = generateStudentInformationReport(student_id, db)
                exams = generateExamReport(student_id, db) or []
                grades = generateGradeReport(student_id, db) or []
                
                # Convert to dictionaries using the helper functions
                student_dict = convert_model_to_dict(student_info)
                exams_dict = convert_models_to_dicts(exams)
                grades_dict = convert_models_to_dicts(grades)
                
                student_data = {
                    "StudentInfo": student_dict,
                    "Exams": exams_dict,
                    "Grades": grades_dict
                }
            except Exception as e:
                print(f"Error generating student report: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating student report: {str(e)}"
                )
        
        if not student_data or not student_data.get("StudentInfo"):
            raise HTTPException(
                status_code=404,
                detail="Student data not found"
            )
        
        # Calculate and return ML prediction
        return predict_graduation_risk(student_data)
    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status codes
        raise
    except Exception as e:
        print(f"Unexpected error in prediction endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )