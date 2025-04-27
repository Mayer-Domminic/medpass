export type Performance = {
    StudentQuestionPerformanceID: number;
    ExamResultsID: number;
    QuestionID: number;
    Result: boolean;
    Confidence: number;
    QuestionPrompt: string;
    QuestionDifficulty: string;
  };
  
  // Define exam result type
  export type ExamResult = {
    ExamResultsID: number;
    StudentID: number;
    StudentName: string;
    ExamID: number;
    ExamName: string;
    Score: number;
    PassOrFail: boolean;
    Timestamp?: string | null;
    ClerkshipID?: number | null;
  };
  
  // New domain props type
  export type DomainProps = {
    examResult: ExamResult;
    performances: Performance[];
  };

  export type Question = {
    id: string;
    text: string;
    difficulty: string;
    result: boolean;
    confidence: number;
    isChecked: boolean;
    isCorrect: boolean;
  };
  
  export type SubdomainType = {
    id: string;
    title: string;
    questions: Question[];
    isLatestConf: boolean;
  };