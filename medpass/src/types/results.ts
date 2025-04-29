export interface ApiResponseItem {
  ExamResults: {
    ExamResultsID: number;
    StudentID?: number;
    StudentName?: string;
    ExamID?: number;
    ExamName?: string;
    Score?: number;
    PassOrFail?: boolean;
    Timestamp?: string | null;
    ClerkshipID?: number | null;
  };
  Performances: Performance[];
}

export type Performance = {
  StudentQuestionPerformanceID: number;
  ExamResultsID: number;
  QuestionID: number;
  Result: boolean;
  Confidence: number;
  QuestionPrompt: string;
  QuestionDifficulty: string;
  SelectedOptionID?: number; // Add this field which is used in the processing
};

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

// API response structure
export type ExamResultData = {
  ExamResults: ExamResult;
  Performances: Performance[];
};

// Component prop types
export type DomainProps = {
  examResult: ExamResult;
  performances: Performance[];
  onQuestionSelect?: (questionId: string, isSelected: boolean) => void;
  selectedQuestions?: string[];
};

// Question-related types
export type Question = {
  id: string;
  text: string;
  difficulty: string;
  result: boolean;
  confidence: number;
  isChecked: boolean;
  isCorrect: boolean;
  imageUrl?: string | null;
  imageDescription?: string | null;
  options?: QuestionOption[];
  correctOption?: number;
  explanation?: string;
  selectedOptionID?: number; // Add this field to track which option was selected
};

export type QuestionOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  explanation?: string;
};

// Types for PreviewQuestion component
export type ContentArea = {
  ContentAreaID: number;
  ContentName: string;
  Description: string;
  Discipline: string;
};

export type GradeClassification = {
  GradeClassificationID: number;
  ClassificationName: string;
  UnitType: string;
  ClassOfferingID: number;
};

export type QuestionDetail = {
  QuestionID: number;
  ExamID: number;
  Prompt: string;
  QuestionDifficulty: string;
  ImageUrl: string | null;
  ImageDependent: boolean;
  ImageDescription: string | null;
  GradeClassificationID: number;
};

export type QuestionData = {
  Question: QuestionDetail;
  Options: Option[];
  ContentAreas: ContentArea[];
  GradeClassification: GradeClassification;
};

export type Option = {
  OptionID: number;
  CorrectAnswer: boolean;
  Explanation: string;
  OptionDescription: string;
};

export type Attempt = {
  attemptNumber: number;
  answer: number; // This should match SelectedOptionID
  correct: boolean;
  confidence: number;
  date: string;
  examName?: string; // Add exam context
  examId?: number; // Add exam ID for better unique identification
};

export interface UserAnswer {
  questionIndex: number;
  questionId?: number;
  selectedAnswers: number[];
  confidenceLevel: string;
  isCorrect: boolean;
  pointsEarned?: number;
}

export type PreviewQuestionProps = {
  question: Question;
  classificationName?: string;
  attempts?: Attempt[];
};

export type SubdomainType = {
  id: string;
  title: string;
  name?: string;
  questions: Question[];
  isLatestConf: boolean;
};

export type SubdomainProps = {
  subdomain: SubdomainType;
  isExpanded: boolean;
  onToggle: () => void;
  onQuestionToggle?: (questionId: string, isChecked: boolean) => void;
  attempts?: Record<string, Attempt[]>;
};