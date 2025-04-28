class QuestionService {
    // Fetch question details including options
    async getQuestionDetails(questionId: string): Promise<any | null> {
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

    // Fetch historical performance data for a student and question using auth token
    async getHistoricalPerformance(accessToken: string, questionId: string): Promise<any[]> {
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
}

export const questionService = new QuestionService();
export default questionService;