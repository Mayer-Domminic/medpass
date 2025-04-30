export async function getQuestionDetails(questionId: string): Promise<any | null> {
    try {
        const response = await fetch(`http://medpass.unr.dev/api/v1/question/${questionId}`);
        if (!response.ok) {
            console.error(`Failed to fetch question details for ID ${questionId}`);
            return null;
        }
        // Return the API response directly since it already matches our expected format
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching question details:', error);
        return null;
    }
}

export async function getHistoricalPerformance(accessToken: string, questionId: string): Promise<any[]> {
    try {
        // First, get all exam results for the student
        const response = await fetch(
            `http://medpass.unr.dev/api/v1/question/historical-performance/?skip=0&limit=100`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            console.error(`Failed to fetch historical performance. Status: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Extract all performances for this specific question ID across all exams
        const allAttempts: any[] = [];

        // Loop through each exam result
        for (const result of data) {
            if (result.Performances && result.Performances.length > 0) {
                // Filter to get only performances for this specific question ID
                const matchingPerformances = result.Performances.filter(
                    (perf: any) => perf.QuestionID.toString() === questionId
                );

                if (matchingPerformances.length > 0) {
                    matchingPerformances.forEach((perf: any) => {
                        // Add exam context to the performance
                        allAttempts.push({
                            ...perf,
                            ExamName: result.ExamResults.ExamName || 'Unknown Exam',
                            ExamDate: result.ExamResults.Timestamp || new Date().toISOString(),
                            ExamResultsID: result.ExamResults.ExamResultsID,
                            StudentID: result.ExamResults.StudentID
                        });
                    });
                }
            }
        }

        // Sort by date (most recent first)
        const sortedAttempts = allAttempts.sort((a, b) => {
            const dateA = new Date(a.ExamDate).getTime();
            const dateB = new Date(b.ExamDate).getTime();
            return dateB - dateA;
        });

        return sortedAttempts;
    } catch (error) {
        console.error('Error fetching historical performance:', error);
        return [];
    }
}

export function formatDate(dateInput: string | Date): string {
    if (!dateInput) return 'Unknown date';

    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';

    // Format as MM/DD/YYYY
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function getAttemptId(attempt: any): string {
    // Create a unique ID based on exam result ID, date, and answer to ensure true uniqueness
    const examId = attempt.ExamResultsID || 'unknown';
    const date = attempt.date || attempt.ExamDate || new Date().toISOString();
    const answer = attempt.answer !== undefined ? attempt.answer :
        (attempt.SelectedOptionID !== undefined ? attempt.SelectedOptionID : 'no-answer');

    return `${examId}-${date}-${answer}`;
}

/**
 * Map option index to letter (0 -> A, 1 -> B, etc.)
 * @param index Index of the option (zero-based)
 * @returns Letter representation of the index
 */
export function getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
}

export function combineAttempts(currentAttempts: any[], historicalAttempts: any[]): any[] {
    // First, normalize current attempts to ensure they have properly formatted dates
    const normalizedCurrentAttempts = currentAttempts.filter(attempt => attempt !== null).map(attempt => ({
        ...attempt,
        date: formatDate(attempt.date),
        attemptId: getAttemptId(attempt)
    }));

    // Process historical attempts into the same format as current attempts
    const processedHistorical = historicalAttempts.filter(histAttempt => {
        // Filter out incomplete historical attempts that don't have required data
        return histAttempt && histAttempt.SelectedOptionID !== undefined;
    }).map(histAttempt => {
        const normalizedAttempt = {
            answer: histAttempt.SelectedOptionID, // Remove default value that could create phantom attempts
            correct: histAttempt.Result === true, // Explicit boolean check
            confidence: histAttempt.Confidence || 0,
            date: formatDate(histAttempt.ExamDate),
            examName: histAttempt.ExamName || 'Unknown exam',
            examId: histAttempt.ExamResultsID,
            attemptId: getAttemptId(histAttempt)
        };
        return normalizedAttempt;
    });

    // Create a map to track unique attempts
    const uniqueAttemptsMap = new Map();

    // Add current attempts to the map
    normalizedCurrentAttempts.forEach(attempt => {
        uniqueAttemptsMap.set(attempt.attemptId, attempt);
    });

    // Add historical attempts to the map (will overwrite duplicates)
    processedHistorical.forEach(attempt => {
        // Only add if not already in the map and if it has valid data
        if (!uniqueAttemptsMap.has(attempt.attemptId) && attempt.answer !== undefined) {
            uniqueAttemptsMap.set(attempt.attemptId, attempt);
        }
    });

    // Convert map back to array
    const allUniqueAttempts = Array.from(uniqueAttemptsMap.values());

    // Sort by date (most recent first)
    const sortedAttempts = allUniqueAttempts.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Most recent first
    });

    return sortedAttempts;
}

export function calculatePerformanceMetrics(attempts: any[]) {
    console.log('[calculatePerformanceMetrics] Input attempts:', attempts);

    if (!attempts || attempts.length === 0) {
        console.log('[calculatePerformanceMetrics] No attempts provided');
        return {
            totalAttempts: 0,
            successRate: 0,
            avgConfidence: 0
        };
    }

    // Just use the array length directly - don't filter
    const totalAttempts = attempts.length;
    console.log(`[calculatePerformanceMetrics] Total attempts: ${totalAttempts}`);

    // Count correct attempts
    const correctAttempts = attempts.filter(a => {
        const isCorrect = a.correct === true || a.Result === true;
        console.log(`[calculatePerformanceMetrics] Attempt ${a.answer || a.SelectedOptionID} correct: ${isCorrect}`);
        return isCorrect;
    }).length;

    console.log(`[calculatePerformanceMetrics] Correct attempts: ${correctAttempts}`);

    // Calculate success rate
    const successRate = Math.round((correctAttempts / totalAttempts) * 100);
    console.log(`[calculatePerformanceMetrics] Success rate: ${successRate}%`);

    // Calculate average confidence, handling various ways confidence might be stored
    let totalConfidence = 0;
    let confidenceCount = 0;

    attempts.forEach(a => {
        const confidence = a.confidence !== undefined ? a.confidence : a.Confidence;

        if (confidence !== undefined && confidence !== null) {
            console.log(`[calculatePerformanceMetrics] Adding confidence: ${confidence}`);
            totalConfidence += Number(confidence);
            confidenceCount++;
        }
    });

    const avgConfidence = confidenceCount > 0
        ? parseFloat((totalConfidence / confidenceCount).toFixed(1))
        : 0;

    console.log(`[calculatePerformanceMetrics] Avg confidence: ${avgConfidence}`);

    return {
        totalAttempts,
        successRate,
        avgConfidence
    };
}