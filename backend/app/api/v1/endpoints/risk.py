from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Tuple
from ....schemas.wrisks import RiskAssessmentResponse, StrengthWeakness
from ....core.database import get_db
from app.models import GradeClassification, StudentGrade

router = APIRouter()


def calculate_strengths_weaknesses(grades, db) -> Tuple[List[StrengthWeakness], List[StrengthWeakness]]:
    """
    Calculate strengths and weaknesses based on the student's grades.
    Averages are calculated per subject and per unit type.
    """
    performance_data = {}
    
    for grade in grades:
        # Fetch the classification details for the grade
        classification = db.query(GradeClassification).filter(
            GradeClassification.gradeclassificationid == grade.gradeclassificationid
        ).first()
        
        if not classification:
            continue
        
        subject = classification.classificationname
        unit_type = classification.unittype
        
        # Calculate performance score (percentage)
        if grade.pointsavailable == 0:
            performance_score = 0.0
        else:
            performance_score = (grade.pointsearned / grade.pointsavailable) * 100
        
        # Log the calculated performance score
        print(f"Subject: {subject}, Unit Type: {unit_type}, Performance Score: {performance_score}%")
        
        # Store performance data per subject and unit type
        key = (subject, unit_type)
        if key not in performance_data:
            performance_data[key] = {
                "total_earned": 0.0,
                "total_available": 0.0,
                "count": 0
            }
        
        performance_data[key]["total_earned"] += grade.pointsearned
        performance_data[key]["total_available"] += grade.pointsavailable
        performance_data[key]["count"] += 1
    
    # Calculate average performance for each subject/unit type
    strengths = []
    weaknesses = []
    
    for (subject, unit_type), data in performance_data.items():
        if data["total_available"] == 0:
            avg_performance = 0.0
        else:
            avg_performance = (data["total_earned"] / data["total_available"]) * 100
        
        # Log the average performance for each subject/unit type
        print(f"Subject: {subject}, Unit Type: {unit_type}, Average Performance: {avg_performance}%")
        
        # Define thresholds for strengths, weaknesses, and neutral categories
        if avg_performance >= 80:
            strengths.append(StrengthWeakness(
                subject=subject,
                unit_type=unit_type,
                performance_score=avg_performance
            ))
        elif avg_performance < 60:
            weaknesses.append(StrengthWeakness(
                subject=subject,
                unit_type=unit_type,
                performance_score=avg_performance
            ))
        else:
            print(f"Neutral subject/unit type: {subject}, {unit_type} with performance: {avg_performance}%")
    
    return strengths, weaknesses




def calculate_risk_assessment(grades) -> Tuple[float, Dict]:
    """
    Calculate the risk assessment based on the student's grades.
    This is a placeholder function; you should replace it with your actual logic.
    """
    total_points_earned = sum(grade.pointsearned for grade in grades)
    total_points_available = sum(grade.pointsavailable for grade in grades)
    
    if total_points_available == 0:
        risk_score = 0.0
    else:
        risk_score = (total_points_earned / total_points_available) * 100
    
    details = {
        "total_points_earned": total_points_earned,
        "total_points_available": total_points_available,
        "grades": [{"gradeclassificationid": grade.gradeclassificationid, "pointsearned": grade.pointsearned, "pointsavailable": grade.pointsavailable} for grade in grades]
    }
    
    return risk_score, details


@router.get("/risk", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get risk assessment for a student based on their grades and exam scores.
    Includes strengths and weaknesses analysis.
    """
    # Fetch the student's grades
    grades = db.query(StudentGrade).filter(StudentGrade.studentid == student_id).all()
    
    if not grades:
        raise HTTPException(
            status_code=404,
            detail="No grades found for the student"
        )
    
    # Calculate the risk assessment
    risk_score, details = calculate_risk_assessment(grades)
    
    # Calculate strengths and weaknesses
    strengths, weaknesses = calculate_strengths_weaknesses(grades, db)
    
    return {
        "risk_score": risk_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "details": details
    }
