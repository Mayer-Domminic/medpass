import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
from collections import namedtuple

from app.main import app
from app.models import LoginInfo as User
from app.models import Student, Faculty, FacultyAccess, GraduationStatus
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
    
@pytest.fixture
def mock_domaindata():
    return [
        DomainReport(
            DomainName = "Blood & Lymphoreticular/Immune Systems",
            ClassificationName = "IMMUNO",
            PointsEarned = 6.0,
            PointsAvailable = 8.0,
            ClassID = 636,
            DateTaught = 2022
        ),
        DomainReport(
            DomainName = "Blood & Lymphoreticular/Immune Systems",
            ClassificationName = "MICRO",
            PointsEarned = 1.0,
            PointsAvailable = 1.0,
            ClassID = 636,
            DateTaught = 2022
        )
    ]

@pytest.fixture
def mock_faculty_user():
    user = MagicMock(spec=User)
    user.username = "Joe Worker"
    user.logininfoid = 416
    user.issuperuser = False
    user.isactive = True
    return user

@pytest.fixture
def test_faculty(mock_faculty_user, mock_db):
    app.dependency_overrides[get_current_active_user] = lambda: mock_faculty_user
    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}

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
    
    #Domains Report Testing
    def test_domain_report_complete(self, test_student, mock_db, mock_domaindata):
        
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        filter_mock.scalar.return_value = 1
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        
        with patch("app.api.v1.endpoints.report.generateDomainReport", return_value=mock_domaindata):
                 
            response = test_student.get("/api/v1/domainreport")
            
        #Checking for a 200 OK response from the API Call
        assert response.status_code == 200
        
        #Checking Student Info Returns the correctly
        domain_info = response.json()["Domains"]
        assert domain_info is not None
        domain_name = list(domain_info.keys())[0]
        domain_data = domain_info[domain_name]
        print("HERE HERE HERE")
        # First Domain
        assert domain_data[0]["DomainName"] == mock_domaindata[0].DomainName
        assert domain_data[0]["ClassificationName"] == mock_domaindata[0].ClassificationName
        assert domain_data[0]["PointsEarned"] == mock_domaindata[0].PointsEarned
        
        #Second Domain
        assert domain_data[1]["DomainName"] == mock_domaindata[1].DomainName
        assert domain_data[1]["ClassificationName"] == mock_domaindata[1].ClassificationName
        assert domain_data[1]["PointsEarned"] == mock_domaindata[1].PointsEarned
        
    def test_faculty_report_isfaculty(self, test_faculty, mock_db, mock_studentdata, mock_examsdata, mock_gradesdata):

        mock_student_query = MagicMock()
        mock_student_query.filter.return_value.first.return_value = None

        mock_faculty_query = MagicMock()
        mock_faculty = MagicMock()
        mock_faculty.facultyid = 1
        mock_faculty_query.filter.return_value.first.return_value = mock_faculty

        print("Mocked is_student result:", mock_student_query.filter.return_value.first.return_value)

        # Mocking Query Behavior
        def query_side_effect(model):
            print(f"Intercepted query for model: {model}")
            return {
                Student: mock_student_query,
                Student.studentid: mock_student_query,
                Faculty: mock_faculty_query,
                Faculty.logininfoid: mock_faculty_query
            }.get(model, MagicMock())

        mock_db.query.side_effect = query_side_effect

        with patch("app.api.v1.endpoints.report.check_faculty_access", return_value=True), \
            patch("app.api.v1.endpoints.report.generateStudentInformationReport", return_value=mock_studentdata), \
            patch("app.api.v1.endpoints.report.generateExamReport", return_value=mock_examsdata), \
            patch("app.api.v1.endpoints.report.generateGradeReport", return_value=mock_gradesdata):

            response = test_faculty.get("/api/v1/faculty_report?student_id=12345")

        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")


        assert response.status_code == 200
        student_info = response.json()["StudentInfo"]
        assert student_info["StudentID"] == mock_studentdata.StudentID
        
    def test_faculty_report_is_not_faculty(self, test_faculty, mock_db):

        mock_student_query = MagicMock()
        mock_student_query.filter.return_value.first.return_value = 1

        mock_faculty_query = MagicMock()
        mock_faculty = MagicMock()
        mock_faculty.facultyid = None
        mock_faculty_query.filter.return_value.first.return_value = mock_faculty

        print("Mocked is_student result:", mock_student_query.filter.return_value.first.return_value)

        # Assign query behavior
        def query_side_effect(model):
            print(f"Intercepted query for model: {model}")
            return {
                Student: mock_student_query,
                Student.studentid: mock_student_query,
                Faculty: mock_faculty_query,
                Faculty.logininfoid: mock_faculty_query
            }.get(model, MagicMock())

        mock_db.query.side_effect = query_side_effect

        with patch("app.api.v1.endpoints.report.check_faculty_access", return_value=True):
            response = test_faculty.get("/api/v1/faculty_report?student_id=12345")

        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")


        assert response.status_code == 403
        assert response.json()["detail"] == "Only faculty members can access this route"
        
    def test_faculty_report_no_student_access(self, test_faculty, mock_db):

        mock_student_query = MagicMock()
        mock_student_query.filter.return_value.first.return_value = None

        mock_faculty_query = MagicMock()
        mock_faculty = MagicMock()
        mock_faculty.facultyid = 1
        mock_faculty_query.filter.return_value.first.return_value = mock_faculty

        # Mock routing for all query
        def query_side_effect(model):
            print(f"Intercepted query for model: {model}")
            return {
                Student: mock_student_query,
                Student.studentid: mock_student_query,
                Faculty: mock_faculty_query,
                Faculty.logininfoid: mock_faculty_query
            }.get(model, MagicMock())

        mock_db.query.side_effect = query_side_effect

        with patch("app.api.v1.endpoints.report.check_faculty_access", return_value=False):
            response = test_faculty.get("/api/v1/faculty_report?student_id=12345")

        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")

        assert response.status_code == 403
        assert response.json()["detail"] == "You do not have permission to access this student's report"
        
    def test_faculty_class_report_access_denied(self, test_faculty, mock_db):

        mock_student_query = MagicMock()
        mock_student_query.filter.return_value.first.return_value = None

        mock_faculty_query = MagicMock()
        mock_faculty = MagicMock()
        mock_faculty.facultyid = 1
        mock_faculty_query.filter.return_value.first.return_value = mock_faculty

        mock_access_query = MagicMock()
        mock_access_query.filter_by.return_value.first.return_value = None

        # Mock Routing for all database Query
        mock_db.query.side_effect = lambda model: {
            Student: mock_student_query,
            Student.studentid: mock_student_query,
            Faculty: mock_faculty_query,
            Faculty.logininfoid: mock_faculty_query,
            FacultyAccess: mock_access_query,
        }.get(model, MagicMock())

        response = test_faculty.get("/api/v1/faculty_class_report?rosteryear=2022")

        assert response.status_code == 403
        assert response.json()["detail"] == "You do not have permission to access this class year"
        
    def test_faculty_class_report_success(self, test_faculty, mock_db, mock_studentdata, mock_examsdata, mock_gradesdata):
        
        mock_student_query = MagicMock()
        mock_student_query.filter.return_value.first.return_value = None
    
        mock_faculty_query = MagicMock()
        mock_faculty = MagicMock()
        mock_faculty.facultyid = 1
        mock_faculty_query.filter.return_value.first.return_value = mock_faculty
      
        mock_access_query = MagicMock()
        mock_access_query.filter_by.return_value.first.return_value = MagicMock()
     
        mock_student_ids_query = MagicMock()
        mock_student_ids_query.join.return_value.filter.return_value.all.return_value = [(1,), (2,)]

        # Mock Routing For All Database Queries
        mock_db.query.side_effect = lambda model: {
            Student: mock_student_query,
            Student.studentid: mock_student_query,
            Faculty: mock_faculty_query,
            Faculty.logininfoid: mock_faculty_query,
            FacultyAccess: mock_access_query,
            GraduationStatus: mock_student_ids_query,
        }.get(model, MagicMock())

        with patch("app.api.v1.endpoints.report.generateStudentInformationReport", return_value=mock_studentdata), \
            patch("app.api.v1.endpoints.report.generateExamReport", return_value=mock_examsdata), \
            patch("app.api.v1.endpoints.report.generateGradeReport", return_value=mock_gradesdata):

            response = test_faculty.get("/api/v1/faculty_class_report?rosteryear=2022")

        assert response.status_code == 200

        json_data = response.json()

        for student_report in json_data:
            assert student_report["StudentInfo"]["StudentID"] == mock_studentdata.StudentID
            assert student_report["StudentInfo"]["LastName"] == mock_studentdata.LastName
            assert student_report["Exams"][0]["ExamName"] == mock_examsdata[0].ExamName
            assert student_report["Grades"][0]["PointsEarned"] == mock_gradesdata[0].PointsEarned
            
if __name__ == "__main__":
    pytest.main(["-v", __file__])
    
    


