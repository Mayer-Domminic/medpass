import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
import json
import pandas as pd
import numpy as np

from app.main import app
from app.models import LoginInfo as User
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.schemas.wrisks import RiskAssessmentResponse, MLPrediction, StrengthWeakness

# Reuse fixtures from test_report.py
@pytest.fixture
def test_admin(mock_admin, mock_db):
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    client = TestClient(app)
    
    yield client

    app.dependency_overrides = {}

@pytest.fixture
def test_student(mock_student, mock_db):
    app.dependency_overrides[get_current_active_user] = lambda: mock_student
    app.dependency_overrides[get_db] = lambda: mock_db
    
    client = TestClient(app)
    
    yield client

    app.dependency_overrides = {}

@pytest.fixture
def mock_db():
    mock = MagicMock(spec=Session)
    return mock

@pytest.fixture
def mock_student():
    user = MagicMock(spec=User)
    user.username = "student1"
    user.logininfoid = 1
    user.issuperuser = False
    user.isactive = True
    return user

@pytest.fixture
def mock_admin():
    user = MagicMock(spec=User)
    user.username = "admin1"
    user.logininfoid = 2
    user.issuperuser = True
    user.isactive = True
    return user

@pytest.fixture
def mock_student_dict():
    """Return a dictionary instead of a Pydantic model"""
    return {
        "StudentID": 926,
        "LastName": "Smith",
        "FirstName": "John",
        "CumGPA": 3.7,
        "MMICalc": 78.5,
        "RosterYear": 2022,
        "GraduationYear": None,
        "Graduated": False,
        "GraduationLength": None,
        "Status": "Active"
    }

@pytest.fixture
def mock_exams_dict():
    """Return a list of dictionaries instead of Pydantic models"""
    return [
        {
            "ExamName": "Step 1",
            "Score": 230,
            "PassScore": 196,
            "PassOrFail": True
        },
        {
            "ExamName": "Step 2",
            "Score": 245,
            "PassScore": 214,
            "PassOrFail": True
        },
        {
            "ExamName": "OSCE",
            "Score": 75,
            "PassScore": 70,
            "PassOrFail": True
        }
    ]

@pytest.fixture
def mock_grades_dict():
    """Return a list of dictionaries instead of Pydantic models"""
    return [
        {
            "ClassificationName": "IMMUNO",
            "PointsEarned": 6.0,
            "PointsAvailable": 8.0,
            "ClassID": 636,
            "DateTaught": 2022
        },
        {
            "ClassificationName": "MICRO",
            "PointsEarned": 1.0,
            "PointsAvailable": 1.0,
            "ClassID": 636,
            "DateTaught": 2022
        },
        {
            "ClassificationName": "PATHO",
            "PointsEarned": 8.0,
            "PointsAvailable": 10.0,
            "ClassID": 637,
            "DateTaught": 2022
        }
    ]

@pytest.fixture
def mock_ml_prediction():
    return MLPrediction(
        prediction=1,
        probability=0.85,
        prediction_text="On-time graduation likely",
        confidence_score=85.0
    )

@pytest.fixture
def mock_predictions_df():
    return pd.DataFrame({
        'StudentID': [926],
        'FirstName': ['John'],
        'LastName': ['Smith'],
        'Gradient_Boosting_Prediction': [1],
        'Gradient_Boosting_Probability': [0.85]
    })

@pytest.fixture
def mock_risk_response():
    """A complete risk assessment response for mocking"""
    return RiskAssessmentResponse(
        risk_score=85.0,
        risk_level="Low",
        strengths=[
            StrengthWeakness(subject="MICRO", unit_type="Course", performance_score=100.0)
        ],
        weaknesses=[],
        ml_prediction=MLPrediction(
            prediction=1,
            probability=0.85,
            prediction_text="On-time graduation likely",
            confidence_score=85.0
        ),
        details={
            "student_name": "John Smith",
            "total_exams": 3,
            "passed_exams": 3,
            "total_grades": 3,
            "ml_model_accuracy": 0.85
        }
    )

class TestRiskEndpoint:
    
    def test_risk_assessment_successful(self, test_admin, mock_db, mock_student_dict, mock_exams_dict, mock_grades_dict, mock_ml_prediction):
        """Test successful risk assessment retrieval"""
        
        student_id = 926
        
        # Create student data directly as dictionary
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": mock_exams_dict,
            "Grades": mock_grades_dict
        }
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=mock_ml_prediction), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", True), \
             patch("app.api.v1.endpoints.risk.MODEL_EVAL", {"best_model": "Gradient Boosting", "Gradient Boosting": {"accuracy": 0.85}}):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Validate response structure
        data = response.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert "strengths" in data
        assert "weaknesses" in data
        assert "ml_prediction" in data
        assert "details" in data
        
        # Validate ML prediction part
        assert data["ml_prediction"]["prediction"] == mock_ml_prediction.prediction
        assert data["ml_prediction"]["probability"] == mock_ml_prediction.probability
        assert data["ml_prediction"]["confidence_score"] == mock_ml_prediction.confidence_score
    
    def test_risk_assessment_student_not_found(self, test_admin, mock_db):
        """Test risk assessment with non-existent student"""
        
        student_id = 999  # Non-existent student
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        filter_mock.first.return_value = None
        query_mock.filter.return_value = filter_mock
        mock_db.query.return_value = query_mock
        
        response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Student data not found"
    
    def test_risk_assessment_with_cached_predictions(self, test_admin, mock_db, mock_student_dict, 
                                                   mock_exams_dict, mock_grades_dict, mock_predictions_df):
        """Test risk assessment with cached predictions"""
        
        student_id = 926
        
        # Create student data directly as dictionary
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": mock_exams_dict,
            "Grades": mock_grades_dict
        }
        
        cached_prediction = {
            "prediction": 1,
            "probability": 0.85
        }
        
        # Mock cached prediction
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.get_cached_prediction", return_value=cached_prediction), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", True), \
             patch("app.api.v1.endpoints.risk.MODEL_EVAL", {"best_model": "Gradient Boosting", "Gradient Boosting": {"accuracy": 0.85}}):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Validate that the cached prediction was used
        data = response.json()
        assert data["ml_prediction"]["prediction"] == 1
        assert data["ml_prediction"]["probability"] == 0.85
        assert data["ml_prediction"]["confidence_score"] == 85.0
    
    def test_risk_assessment_no_ml_model(self, test_admin, mock_db, mock_student_dict, mock_exams_dict, mock_grades_dict):
        """Test risk assessment when ML model is not loaded"""
        
        student_id = 926
        
        # Create student data directly as dictionary
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": mock_exams_dict,
            "Grades": mock_grades_dict
        }
        
        # Create a prediction for when ML model is not available
        ml_error_prediction = MLPrediction(
            prediction=-1,
            probability=0.0,
            prediction_text="ML model not available",
            confidence_score=0.0
        )
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=ml_error_prediction), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", False):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Validate that ML prediction indicates model unavailability
        data = response.json()
        assert data["ml_prediction"]["prediction"] == -1
        assert data["ml_prediction"]["prediction_text"] == "ML model not available"
    
    def test_risk_assessment_no_exams(self, test_admin, mock_db, mock_student_dict, mock_grades_dict, mock_ml_prediction):
        """Test risk assessment for student with no exams"""
        
        student_id = 926
        
        # Create student data with no exams
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": [],
            "Grades": mock_grades_dict
        }
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=mock_ml_prediction), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", True):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Should still calculate risk score but might have different strengths/weaknesses
        data = response.json()
        assert "risk_score" in data
    
    def test_risk_assessment_no_grades(self, test_admin, mock_db, mock_student_dict, mock_exams_dict, mock_ml_prediction):
        """Test risk assessment for student with no grades"""
        
        student_id = 926
        
        # Create student data with no grades
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": mock_exams_dict,
            "Grades": []
        }
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=mock_ml_prediction), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", True):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Should still calculate risk score but might have different strengths/weaknesses
        data = response.json()
        assert "risk_score" in data
    
    def test_prediction_endpoint(self, test_admin, mock_db, mock_student_dict, mock_exams_dict, mock_grades_dict, mock_ml_prediction):
        """Test the standalone prediction endpoint"""
        
        student_id = 926
        
        # Create student data directly as dictionary
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": mock_exams_dict,
            "Grades": mock_grades_dict
        }
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=mock_ml_prediction):
            
            response = test_admin.get(f"/api/v1/info/prediction?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Validate ML prediction structure
        data = response.json()
        assert data["prediction"] == mock_ml_prediction.prediction
        assert data["probability"] == mock_ml_prediction.probability
        assert data["prediction_text"] == mock_ml_prediction.prediction_text
        assert data["confidence_score"] == mock_ml_prediction.confidence_score

    def test_from_json_cache(self, test_admin, mock_db):
        """Test retrieving student data from JSON cache"""
        
        student_id = 926
        mock_student_data = {
            "StudentInfo": {
                "StudentID": 926,
                "FirstName": "John",
                "LastName": "Smith",
                "CumGPA": 3.7
            },
            "Exams": [
                {"ExamName": "Step 1", "Score": 230, "PassScore": 196, "PassOrFail": True}
            ],
            "Grades": [
                {"ClassificationName": "IMMUNO", "PointsEarned": 6.0, "PointsAvailable": 8.0}
            ]
        }
        
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=mock_student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", return_value=MLPrediction(
                prediction=1,
                probability=0.85,
                prediction_text="On-time graduation likely",
                confidence_score=85.0
             )), \
             patch("app.api.v1.endpoints.risk.ML_LOADED", True):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 200
        
        # Should use the cached data without calling the report generation functions
        data = response.json()
        assert data["details"]["student_name"] == "John Smith"
        
    def test_error_handling(self, test_admin, mock_db, mock_student_dict):
        """Test error handling during risk calculation"""
        
        student_id = 926
        
        # Create student data
        student_data = {
            "StudentInfo": mock_student_dict,
            "Exams": [],  # Empty to cause an error when calculating strengths/weaknesses
            "Grades": []
        }
        
        # Simulate an exception during prediction
        with patch("app.api.v1.endpoints.risk.get_student_from_json", return_value=student_data), \
             patch("app.api.v1.endpoints.risk.predict_graduation_risk", side_effect=Exception("Test error")):
            
            response = test_admin.get(f"/api/v1/info/risk?student_id={student_id}")
            
        assert response.status_code == 500
        assert "error" in response.json()["detail"].lower()
        
if __name__ == "__main__":
    pytest.main(["-v", __file__])