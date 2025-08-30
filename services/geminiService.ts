import { Analysis } from '../types';

interface GenerateQuestionOptions {
    askedQuestions?: string[];
    resumeText?: string;
}

export const generateInterviewQuestion = async (options: GenerateQuestionOptions): Promise<string> => {
  try {
    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "An unknown server error occurred." }));
      throw new Error(errorData.message || "Failed to generate question from the server.");
    }
    
    const data = await response.json();
    return data.question;

  } catch (error) {
    console.error("Error calling /api/generate-question:", error);
    throw new Error("Could not generate a new question from the AI.");
  }
};

export const analyzeAnswer = async (question: string, answer: string, resumeText?: string): Promise<Analysis> => {
  try {
    const response = await fetch('/api/analyze-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, resumeText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "An unknown server error occurred." }));
      throw new Error(errorData.message || "Failed to get analysis from the server.");
    }
    
    const parsedJson = await response.json();

    // Basic validation
    if (typeof parsedJson.score !== 'number' || typeof parsedJson.suggestedAnswerFresher !== 'string' || typeof parsedJson.suggestedAnswerProfessional !== 'string') {
        throw new Error("AI response did not match the expected format.");
    }
    
    return parsedJson as Analysis;

  } catch (error) {
    console.error("Error calling /api/analyze-answer:", error);
    throw new Error("Could not get analysis from the AI.");
  }
};
