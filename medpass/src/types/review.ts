// Interface matching the API response format
export interface QuestionResponseData {
    Question: {
        QuestionID: number;
        ExamID: number;
        Prompt: string;
        QuestionDifficulty: string;
        ImageUrl: string | null;
        ImageDependent: boolean;
        ImageDescription: string | null;
        ExamName?: string;
    };
    Options: {
        OptionID: number;
        CorrectAnswer: boolean;
        Explanation: string;
        OptionDescription: string;
    }[];
    GradeClassification: {
        GradeClassificationID: number;
        ClassificationName: string;
    };
}

// Props interface for the Question component
export interface QuestionProps {
    questionData: QuestionResponseData;
    showFeedback?: boolean;
    savedAnswers?: number[]; // Array of option IDs
    savedConfidenceLevel?: string;
}

// Structure for user answer data
export interface UserAnswer {
    questionIndex: number;
    selectedAnswers: number[]; // Array for multiple correct answers
    confidenceLevel: string;
    isCorrect: boolean;
    pointsEarned?: number;
}

// Confidence level options
export const confidenceLevels = [
    { id: "very-bad", label: "Very Bad" },
    { id: "bad", label: "Bad" },
    { id: "neutral", label: "Neutral" },
    { id: "good", label: "Good" },
    { id: "very-good", label: "Very Good" }
];

// Submission status type
export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

// Helper function to convert confidence level string to number for backend
export const confidenceToInt = (confidenceStr: string): number => {
    switch (confidenceStr.toLowerCase()) {
        case 'very-good': return 5;
        case 'good': return 4;
        case 'neutral': return 3;
        case 'bad': return 2;
        case 'very-bad': return 1;
        default: return 3; // Default to neutral if unknown
    }
};

// Define the return type for the submitQuizResultsToDatabase function
export interface SubmissionSuccessResult {
    success: true;
    data: any;
}

export interface SubmissionErrorResult {
    success: false;
    message: string;
}

export type SubmissionResult = SubmissionSuccessResult | SubmissionErrorResult;