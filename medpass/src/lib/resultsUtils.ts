
export async function getQuestionDetails(questionId: string): Promise<any | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/question/${questionId}`);
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
        // Use the auth token to let the backend determine the student
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/question/historical-performance/?skip=0&limit=100`,
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
        // Filter and process the data to find all instances of the specific questionId
        const allPerformances: any[] = [];
        // Loop through each exam result
        for (const result of data) {
            // Check if this exam result has performances
            if (result.Performances && result.Performances.length > 0) {
                // Look for the specific questionId in this exam's performances
                const matchingPerformances = result.Performances.filter(
                    (perf: any) => perf.QuestionID.toString() === questionId
                );
                // If found, add context from the exam result and add to our collection
                if (matchingPerformances.length > 0) {
                    matchingPerformances.forEach((perf: any) => {
                        allPerformances.push({
                            ...perf,
                            ExamName: result.ExamResults.ExamName,
                            ExamDate: result.ExamResults.Timestamp,
                            ExamResultsID: result.ExamResults.ExamResultsID
                        });
                    });
                }
            }
        }
        return allPerformances;
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
    // Create a unique ID based on date and answer
    const date = attempt.date || attempt.ExamDate;
    const answer = attempt.answer || attempt.SelectedOptionID;
    return `${date}-${answer}`;
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
    const normalizedCurrentAttempts = currentAttempts.map(attempt => ({
        ...attempt,
        date: formatDate(attempt.date),
        attemptId: getAttemptId(attempt)
    }));

    // Process historical attempts into the same format as current attempts
    const processedHistorical = historicalAttempts.map(histAttempt => {
        const normalizedAttempt = {
            answer: histAttempt.SelectedOptionID || 2,
            correct: histAttempt.Result || false,
            confidence: histAttempt.Confidence || 0,
            date: formatDate(histAttempt.ExamDate),
            examName: histAttempt.ExamName || 'Unknown exam',
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
        // Only add if not already in the map
        if (!uniqueAttemptsMap.has(attempt.attemptId)) {
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
    if (!attempts || attempts.length === 0) {
        return {
            totalAttempts: 0,
            successRate: 0,
            avgConfidence: 0
        };
    }

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const successRate = Math.round((correctAttempts / totalAttempts) * 100);
    const totalConfidence = attempts.reduce((acc, curr) => acc + (curr.confidence || 0), 0);
    const avgConfidence = parseFloat((totalConfidence / totalAttempts).toFixed(1));

    return {
        totalAttempts,
        successRate,
        avgConfidence
    };
}