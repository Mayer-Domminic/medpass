--Exams and Questions Schemas

--Strong Entities (Create First)
CREATE TABLE Exam (
    ExamID INT PRIMARY KEY,
    ExamName VARCHAR(255) NOT NULL,
    ExamDescription VARCHAR(255)
);

CREATE TABLE ContentArea (
    ContentAreaID INT PRIMARY KEY,
    ContentName VARCHAR(255) NOT NULL,
    Description VARCHAR(255),
    Discipline VARCHAR(40)
);

CREATE TABLE Option (
    OptionID INT PRIMARY KEY,
    OptionDescription VARCHAR(255) NOT NULL
);

--Weak Entities (Create Second)
CREATE TABLE Question (
    QuestionID INT IDENTITY(10,1) PRIMARY KEY,
    ExamID INT FOREIGN KEY REFERENCES Exam(ExamID),
    Prompt VARCHAR(255) NOT NULL,
    QuestionDifficulty VARCHAR(40)
);

--Intersection Entity (Create Last)
CREATE TABLE QuestionClassification (
    QuestionClassID INT IDENTITY(1,1) PRIMARY KEY,
    QuestionID INT FOREIGN KEY REFERENCES Question(QuestionID),
    ContentAreaID INT FOREIGN KEY REFERENCES ContentArea(ContentAreaID)
);

CREATE TABLE QuestionOptions (
    QuestionOptionID INT IDENTITY(1,1) PRIMARY KEY,
    QuestionID FOREIGN KEY REFERENCES Question(QuestionID),
    OptionID FOREIGN KEY REFERENCES Option(OptionID),
    CorrectAnswer BIT
);

--Student Information and Clerkship/Exam Results Schema

--Strong Entities (Create First)
CREATE TABLE ClassRoster (
    ClassRosterID INT IDENTITY(1,1) PRIMARY KEY,
    RosterYear DATE NOT NULL,
    InitialRosterAmount INT,
    CurrentEnrollment INT
);

CREATE TABLE LoginInfo (
    LoginInfoID INT IDENTITY(1, 10) PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Email VARCHAR(255)
);

--Weak Entities (Create Second)
CREATE TABLE Student (
    StudentID INT PRIMARY KEY,
    LoginInfoID INT FOREIGN KEY REFERENCES LoginInfo(LoginInfoID),
    LastName VARCHAR(40),
    FirstName VARCHAR(40)
);

CREATE TABLE Extracurriculars (
    ExtracurricularID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Student(StudentID),
    ActivityName VARCHAR(255),
    ActivityDescription VARCHAR(255),
    WeeklyHourCommitment INT
);

CREATE TABLE Clerkship (
    ClerkshipID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Student(StudentID),
    ClerkshipName VARCHAR(255) NOT NULL,
    ClerkshipDescription VARCHAR(255),
    StartDate DATE,
    EndDate DATE,
    Company VARCHAR(255)
);

--Intersection Entities (Do Last)
CREATE TABLE ExamResults (
    ExamResultsID INT IDENTITY (1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Student(StudentID),
    ExamID INT FOREIGN KEY REFERENCES Exam(ExamID),
    ClerkshipID INT FOREIGN KEY REFERENCES Clerkship(ClerkshipID),
    Score INT NOT NULL,
    PassOrFail BIT
);

CREATE TABLE StudentQuestionPerformance (
    StudentQuestionPerformanceID INT IDENTITY(1,1) PRIMARY KEY,
    ExamResultsID INT FOREIGN KEY REFERENCES ExamResults(ExamResultsID),
    QuestionID INT FOREIGN KEY REFERENCES Question(QuesitonID),
    Result BIT NOT NULL
);

CREATE TABLE GraduationStatus(
    GraduationStatusID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Student(StudentID),
    ClassRosterID INT FOREIGN KEY REFERENCES ClassRoster(ClassRosterID),
    GraduationYear DATE,
    Graduated BIT,
    GraduationLength INT,
    Status VARCHAR(255)
);

--Faculty & Class Offerings

--Strong Entities (Do First)
CREATE TABLE Class (
    ClassID INT PRIMARY KEY,
    ClassName VARCHAR(255) NOT NULL,
    ClassDescription VARCHAR(255),
    Block INT
);

--Weak Entities (Do Second)
CREATE TABLE Faculty (
    FacultyID INT PRIMARY KEY,
    LoginInfoID INT FOREIGN KEY REFERENCES LoginInfo(LoginInfoID),
    FirstName VARCHAR(255),
    LastName VARCHAR(255),
    Position VARCHAR(255)
);

CREATE TABLE ClassOffering (
    ClassOfferingID INT PRIMARY KEY,
    FacultyID INT FOREIGN KEY REFERENCES Faculty(FacultyID),
    ClassID INT FOREIGN KEY REFERENCES Class(ClassID),
    DateTaught DATE,
    Semester VARCHAR(40);
);

--Intersection Entity (Do Last)
CREATE TABLE EnrollmentRecord (
    EnrollmentRecord INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT FOREIGN KEY REFERENCES Student(StudentID),
    ClassOfferingID INT FOREIGN KEY REFERENCES ClassOffering(ClassOfferingID),
    GradePercentage FLOAT,
    PassFailStatus BIT,
    AttendancePercentage FLOAT
);





