import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.models import LoginInfo as User
from app.core.database import get_db
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, DomainReport, StudentCompleteReport
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

class TestStudent:
    
    def test_admin_access(self, test_admin):
        
        response = test_admin.get("/api/v1/student/info")
        
        #Checking that a 403 error is sent as Admins can not access the student route API 
        assert response.status_code == 403
        assert response.json()["detail"] == "Admins accounts can not access student reports route"
        
    def test_logininfo_not_attached_student(self, test_student, mock_db):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = None
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock

        response = test_student.get("/api/v1/student/info")
        
        #Checking that correct 404 error and details are being sent
        assert response.status_code == 404
        assert response.json()["detail"] == "Login Info is not Attached to a Student"
        
    def test_student_information(self, test_student, mock_studentdata, mock_db):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = 1
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        
        with patch("app.api.v1.endpoints.student.generateStudentInformationReport", return_value=mock_studentdata):
                
            response = test_student.get("/api/v1/student/info")
        
        #Checking for a 200 OK response from the API Call
        assert response.status_code == 200
        
        #Just testing 3 of the results no need to check the entire .json request if three matches all good
        assert response.json()["StudentID"] == mock_studentdata.StudentID
        assert response.json()["LastName"] == mock_studentdata.LastName
        assert response.json()["FirstName"] == mock_studentdata.FirstName
        

if __name__ == "__main__":
    pytest.main(["-v", __file__])