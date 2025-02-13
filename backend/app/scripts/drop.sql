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
DROP INDEX IF EXISTS idxLoginInfoUsername;
DROP INDEX IF EXISTS idxStudentName;
DROP INDEX IF EXISTS idxExtracurricularsStudent;
DROP INDEX IF EXISTS idxClerkshipStudent;
DROP INDEX IF EXISTS idxClerkshipDates;
DROP INDEX IF EXISTS idxClassBlock;
DROP INDEX IF EXISTS idxFacultyName;
DROP INDEX IF EXISTS idxClassOfferingDates;
DROP INDEX IF EXISTS idxClassOfferingFaculty;
DROP INDEX IF EXISTS idxEnrollmentRecordStudent;
DROP INDEX IF EXISTS idxEnrollmentRecordClass;
DROP INDEX IF EXISTS idxStudentGradeStudent;
DROP INDEX IF EXISTS idxGradeClassificationClass;
DROP INDEX IF EXISTS idxQuestionExam;
DROP INDEX IF EXISTS idxQuestionClassificationContent;
DROP INDEX IF EXISTS idxQuestionOptionsQuestion;
DROP INDEX IF EXISTS idxQuestionOptionsCorrect;
DROP INDEX IF EXISTS idxExamResultsStudent;
DROP INDEX IF EXISTS idxExamResultsExam;
DROP INDEX IF EXISTS idxExamResultsClerkship;
DROP INDEX IF EXISTS idxStudentQuestionPerfExam;
DROP INDEX IF EXISTS idxStudentQuestionPerfQuestion;
DROP INDEX IF EXISTS idxGraduationStatusStudent;
DROP INDEX IF EXISTS idxGraduationStatusYear;