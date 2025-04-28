import { QuestionResponseData, UserAnswer } from '../types/review';
import { useSession, getSession } from 'next-auth/react';

// hook to get student name from session
export const useStudentName = () => {
    const { data: session } = useSession();
    return session?.user?.name || null;
};

// Function to get auth token from NextAuth session
export const getAuthToken = async (): Promise<string | null> => {
    try {
        const session = await getSession();
        return session?.accessToken || null;
    } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
    }
};

// Format request headers with auth token
export const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAuthToken();

    if (!token) {
        console.warn("No auth token available for API request");
    }

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

// API base URL determination
export const getApiBaseUrl = (): string => {
    return typeof window === "undefined"
        ? "http://backend:8000"
        : "http://localhost:8000";
};

// Function to fetch student information (including student_id)
export const fetchStudentInfo = async (): Promise<any> => {
    try {
        const API_URL = getApiBaseUrl();
        const headers = await getHeaders();

        const response = await fetch(`${API_URL}/api/v1/student/info`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Error details: ${errorText}`);
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Retrieved student information:", data);
        return data;
    } catch (error) {
        console.error('Failed to fetch student information:', error);
        throw error;
    }
};

// Function to fetch question details from API
export const fetchQuestionDetails = async (questionId: number): Promise<QuestionResponseData> => {
    try {
        const API_URL = getApiBaseUrl();
        const headers = await getHeaders();

        const response = await fetch(`${API_URL}/api/v1/question/${questionId}`, {
            headers
        });

        if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Error details: ${errorText}`);
            throw new Error(`Error: ${response.status}`);
        }

        // Parse the response JSON
        const data = await response.json();
        console.log("Received question data for ID:", questionId);

        // The API already returns data in the correct format, so we can return it directly
        // TypeScript will verify that it matches the QuestionResponseData interface
        return data as QuestionResponseData;
    } catch (error) {
        console.error('Failed to fetch question:', error);
        throw error;
    }
};

// Function to fetch all questions needed for the quiz
export const fetchQuizQuestions = async (questionIds: number[]): Promise<QuestionResponseData[]> => {
    try {
        const questionsPromises = questionIds.map(id => fetchQuestionDetails(id));
        return await Promise.all(questionsPromises);
    } catch (error) {
        console.error('Failed to fetch quiz questions:', error);
        throw error;
    }
};

export const getCorrectAnswerCount = (questionData: QuestionResponseData): number => {
    if (!questionData || !questionData.Options) return 0;
    return questionData.Options.filter(opt => opt.CorrectAnswer).length;
};

// Helper function to count how many correct answers the user selected
export const countCorrectAnswers = (selectedAnswers: number[], questionOptions: any[]): number => {
    if (!selectedAnswers || !questionOptions) return 0;

    return selectedAnswers.reduce((count, answerId) => {
        const option = questionOptions.find(opt => opt.OptionID === answerId);
        return option && option.CorrectAnswer ? count + 1 : count;
    }, 0);
};

// Calculate total possible points across all questions
export const calculateTotalPossiblePoints = (questions: QuestionResponseData[]): number => {
    if (!questions || !Array.isArray(questions)) return 0;

    return questions.reduce((total, question) => {
        if (!question || !question.Options) return total;
        // Count correct options in this question
        const correctCount = question.Options.filter(opt => opt.CorrectAnswer).length;
        return total + correctCount;
    }, 0);
};

// Calculate user's total score based on their answers
export const calculateUserScore = (userAnswers: UserAnswer[], questions: QuestionResponseData[]): number => {
    if (!userAnswers || !Array.isArray(userAnswers) || !questions || !Array.isArray(questions)) return 0;

    return userAnswers.reduce((total, answer) => {
        // If we already calculated pointsEarned, use that
        if (answer.pointsEarned !== undefined) {
            return total + answer.pointsEarned;
        }

        // Otherwise calculate it
        if (!answer.questionIndex && answer.questionIndex !== 0) return total;

        const question = questions[answer.questionIndex];
        if (!question || !question.Options || !Array.isArray(answer.selectedAnswers)) return total;

        // Count how many correct options the user selected
        const correctSelected = answer.selectedAnswers.reduce((count, optionId) => {
            const option = question.Options.find(opt => opt.OptionID === optionId);
            return option && option.CorrectAnswer ? count + 1 : count;
        }, 0);

        return total + correctSelected;
    }, 0);
};

// Modified submitQuizResultsToDatabase function
export const submitQuizResultsToDatabase = async (
    studentId: number,
    examId: number,
    userAnswers: UserAnswer[],
    questions: QuestionResponseData[],
    score: number,
    answeredQuestions: number[],
    totalPossiblePoints?: number
) => {
    try {
        // Convert confidence levels to integer values
        const confidenceToInt = (confidenceStr: string): number => {
            switch (confidenceStr.toLowerCase()) {
                case 'very-good': return 5;
                case 'good': return 4;
                case 'neutral': return 3;
                case 'bad': return 2;
                case 'very-bad': return 1;
                default: return 3; // Default to neutral if unknown
            }
        };

        // Calculate percentage score using total possible points
        const actualTotalPoints = totalPossiblePoints || calculateTotalPossiblePoints(questions);
        const percentageScore = Math.round((score / actualTotalPoints) * 100);

        // Format the data according to the expected API schema with correct capitalization
        const formattedData = {
            StudentID: studentId,
            ExamID: examId,
            ClerkshipID: null, // Set to actual clerkship ID if available
            Score: percentageScore, // Rounded to integer percentage
            PassOrFail: null, // Let backend determine this based on exam pass score
            Timestamp: new Date().toISOString(),
            Performances: userAnswers.map((answer: UserAnswer) => {
                // Calculate points earned if not already in the answer
                const pointsEarned = answer.pointsEarned !== undefined
                    ? answer.pointsEarned
                    : countCorrectAnswers(answer.selectedAnswers, questions[answer.questionIndex].Options);

                // Calculate total possible points for this question
                const totalPossible = getCorrectAnswerCount(questions[answer.questionIndex]);

                return {
                    QuestionID: questions[answer.questionIndex].Question.QuestionID,
                    Result: answer.isCorrect,
                    Confidence: confidenceToInt(answer.confidenceLevel),
                    PointsEarned: pointsEarned,
                    TotalPossible: totalPossible
                };
            })
        };

        console.log('Submitting formatted data:', formattedData);

        const API_URL = getApiBaseUrl();
        const headers = await getHeaders();

        const response = await fetch(`${API_URL}/api/v1/question/exam-results-with-performance/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(formattedData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to submit quiz results:', errorText);
            return { success: false, message: `Failed to submit: ${response.status}` };
        }

        const result = await response.json();
        console.log('Quiz results submitted successfully:', result);
        return { success: true, data: result };

    } catch (error) {
        console.error('Error submitting quiz results:', error);
        return { success: false, message: String(error) };
    }
};

// Local storage functions
export const saveQuizState = (
    currentQuestionIndex: number,
    userAnswers: UserAnswer[],
    answeredQuestions: number[],
    score: number,
    totalPossiblePoints?: number
) => {
    const quizState = {
        currentQuestionIndex,
        userAnswers,
        answeredQuestions,
        score,
        totalPossiblePoints
    };
    localStorage.setItem('reviewSessionState', JSON.stringify(quizState));
};

export const loadQuizState = () => {
    const savedState = localStorage.getItem('reviewSessionState');
    if (savedState) {
        try {
            return JSON.parse(savedState);
        } catch (error) {
            console.error('Error parsing saved quiz state', error);
            return null;
        }
    }
    return null;
};

// Helper function to check if answers are correct
export const checkIfCorrect = (selected: number[], options: any[]): boolean => {
    // Get all correct option IDs
    const correctOptionIds = options
        .filter(option => option.CorrectAnswer)
        .map(option => option.OptionID);

    // If the arrays have different lengths, they can't be the same
    if (selected.length !== correctOptionIds.length) {
        return false;
    }

    // Check if all selected options are correct and all correct options are selected
    const allSelectedAreCorrect = selected.every(id => correctOptionIds.includes(id));
    const allCorrectAreSelected = correctOptionIds.every(id => selected.includes(id));

    return allSelectedAreCorrect && allCorrectAreSelected;
};

// Helper function to determine if image should be displayed
export const shouldDisplayImage = (questionData: QuestionResponseData): boolean => {
    return questionData &&
        questionData.Question &&
        questionData.Question.ImageDependent &&
        (questionData.Question.ImageUrl || questionData.Question.ImageDescription)
        ? true : false;
};

// Helper function to get grade classification name
export const getGradeClassificationName = (questionData: QuestionResponseData): string => {
    return questionData.GradeClassification?.ClassificationName || '';
};