--Rino David

--Removed in order of dependecies

-- Drop tables (in order to handle dependencies)
DROP TABLE IF EXISTS StudentGrade;
DROP TABLE IF EXISTS EnrollmentRecord;
DROP TABLE IF EXISTS GradeClassification;
DROP TABLE IF EXISTS ClassOffering;
DROP TABLE IF EXISTS Faculty;
DROP TABLE IF EXISTS Class;
DROP TABLE IF EXISTS GraduationStatus;
DROP TABLE IF EXISTS StudentQuestionPerformance;
DROP TABLE IF EXISTS ExamResults;
DROP TABLE IF EXISTS Clerkship;
DROP TABLE IF EXISTS Extracurriculars;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS LoginInfo;
DROP TABLE IF EXISTS ClassRoster;
DROP TABLE IF EXISTS QuestionOptions;
DROP TABLE IF EXISTS QuestionClassification;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Option;
DROP TABLE IF EXISTS ContentArea;
DROP TABLE IF EXISTS Exam;

--Then Drop Created Indexes
DROP INDEX IF EXISTS idxLoginInfoUsername ON LoginInfo;
DROP INDEX IF EXISTS idxStudentName ON Student;
DROP INDEX IF EXISTS idxExtracurricularsStudent ON Extracurriculars;
DROP INDEX IF EXISTS idxClerkshipStudent ON Clerkship;
DROP INDEX IF EXISTS idxClerkshipDates ON Clerkship;
DROP INDEX IF EXISTS idxClassBlock ON Class;
DROP INDEX IF EXISTS idxFacultyName ON Faculty;
DROP INDEX IF EXISTS idxClassOfferingDates ON ClassOffering;
DROP INDEX IF EXISTS idxClassOfferingFaculty ON ClassOffering;
DROP INDEX IF EXISTS idxEnrollmentRecordStudent ON EnrollmentRecord;
DROP INDEX IF EXISTS idxEnrollmentRecordClass ON EnrollmentRecord;
DROP INDEX IF EXISTS idxStudentGradeStudent ON StudentGrade;
DROP INDEX IF EXISTS idxGradeClassificationClass ON GradeClassification;
DROP INDEX IF EXISTS idxQuestionExam ON Question;
DROP INDEX IF EXISTS idxQuestionClassificationContent ON QuestionClassification;
DROP INDEX IF EXISTS idxQuestionOptionsQuestion ON QuestionOptions;
DROP INDEX IF EXISTS idxQuestionOptionsCorrect ON QuestionOptions;
DROP INDEX IF EXISTS idxExamResultsStudent ON ExamResults;
DROP INDEX IF EXISTS idxExamResultsExam ON ExamResults;
DROP INDEX IF EXISTS idxExamResultsClerkship ON ExamResults;
DROP INDEX IF EXISTS idxStudentQuestionPerfExam ON StudentQuestionPerformance;
DROP INDEX IF EXISTS idxStudentQuestionPerfQuestion ON StudentQuestionPerformance;
DROP INDEX IF EXISTS idxGraduationStatusStudent ON GraduationStatus;
DROP INDEX IF EXISTS idxGraduationStatusYear ON GraduationStatus;