import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.models import LoginInfo as User
from app.core.database import get_db
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, StudentCompleteReport
from app.core.security import (
    get_current_active_user
)

#Fixtures to set-up enviroment for testing
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
    user.username = "amognus"
    user.logininfoid = 1
    user.issuperuser = False
    user.isactive = True
    return user

@pytest.fixture
def mock_admin():
    user = MagicMock(spec=User)
    user.username = "superamongus"
    user.logininfoid = 2
    user.issuperuser = True
    user.isactive = True
    return user

@pytest.fixture
def mock_studentdata():
    return StudentReport(
        StudentID = 1,
        LastName = "Mama",
        FirstName = "Joe",
        CumGPA = 3.5,
        MMICalc = 85.5,
        RosterYear = 2022,
        GraduationYear = 2026,
        Graduated = False,
        GraduationLength = 4,
        Status = "Active"
    ) 

@pytest.fixture
def mock_examsdata():
    return [
        ExamReport(
            ExamName = "Step 1",
            Score = 230,
            PassScore = 196,
            PassOrFail = True
        ),
        ExamReport(
            ExamName = "Step 2",
            Score = 245,
            PassScore = 214,
            PassOrFail = True
        )
    ]    

@pytest.fixture
def mock_gradesdata():
    return [
        GradeReport(
            ClassificationName = "IMMUNO",
            PointsEarned = 6.0,
            PointsAvailable = 8.0,
            ClassID = 636,
            DateTaught = 2022
        ),
        GradeReport(
            ClassificationName = "MICRO",
            PointsEarned = 1.0,
            PointsAvailable = 1.0,
            ClassID = 636,
            DateTaught = 2022
        )
    ]

class TestReport:
    
    def test_admin_access(self, test_admin):
        
        response = test_admin.get("/api/v1/report")
        
        #Checking that a 403 error is sent as Admins can not access the student route API 
        assert response.status_code == 403
        assert response.json()["detail"] == "Admins accounts can not access student reports route"
    
        
    def test_logininfo_not_attached_student(self, test_student, mock_db):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = None
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock

        response = test_student.get("/api/v1/report")
        
        #Checking that correct 404 error and details are being sent
        assert response.status_code == 404
        assert response.json()["detail"] == "Login Info is not Attached to a Student"
        
    def test_report_with_empty_exams_grades(self, test_student, mock_studentdata, mock_db):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = 1
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        
        with patch("app.api.v1.endpoints.report.generateStudentInformationReport", return_value=mock_studentdata), \
             patch("app.api.v1.endpoints.report.generateExamReport", return_value=[]), \
             patch("app.api.v1.endpoints.report.generateGradeReport", return_value=[]):
                
            response = test_student.get("/api/v1/report")
        
        #Checking for a 200 OK response from the API Call
        assert response.status_code == 200
        
        #Just testing 3 of the results no need to check the entire .json request if three matches all good
        assert response.json()["StudentInfo"]["StudentID"] == mock_studentdata.StudentID
        assert response.json()["StudentInfo"]["LastName"] == mock_studentdata.LastName
        assert response.json()["StudentInfo"]["FirstName"] == mock_studentdata.FirstName
        
        #Checks empty and ensures that a JSON request with only empty exams & grades is possible
        assert response.json()["Exams"] == []
        assert response.json()["Grades"] == []
        
    def test_report_complete(self, test_student, mock_db, mock_studentdata, mock_examsdata, mock_gradesdata):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = 1
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        
        with patch("app.api.v1.endpoints.report.generateStudentInformationReport", return_value=mock_studentdata), \
             patch("app.api.v1.endpoints.report.generateExamReport", return_value=mock_examsdata), \
             patch("app.api.v1.endpoints.report.generateGradeReport", return_value=mock_gradesdata):
                 
            response = test_student.get("/api/v1/report")
            
        #Checking for a 200 OK response from the API Call
        assert response.status_code == 200
        
        #Checking Student Info Returns the correctly
        student_info = response.json()["StudentInfo"]
        assert student_info["StudentID"] == mock_studentdata.StudentID
        assert student_info["LastName"] == mock_studentdata.LastName
        assert student_info["FirstName"] == mock_studentdata.FirstName
        
        #Checking if Exams are returning correctly AND is the right length (no phantom exams)
        exams = response.json()["Exams"]
        assert len(exams) == len(mock_examsdata)
        assert exams[0]["ExamName"] == mock_examsdata[0].ExamName
        assert exams[1]["Score"] == mock_examsdata[1].Score
        
        #Checking if Grades are returning correctly AND is the right length (no phantom grades)
        grades = response.json()["Grades"]
        assert len(grades) == len(mock_gradesdata)
        assert grades[0]["ClassificationName"] == mock_gradesdata[0].ClassificationName  
        assert grades[1]["PointsEarned"] == mock_gradesdata[1].PointsEarned
    
if __name__ == "__main__":
    pytest.main(["-v", __file__])
    
    


