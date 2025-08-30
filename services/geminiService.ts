import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Analysis } from '../types';

// IMPORTANT: For this to work, you must replace "YOUR_API_KEY_HERE" with your actual Google Gemini API key.
// 1. Go to https://aistudio.google.com/app/apikey to get your key.
// 2. Replace the placeholder text below.
const apiKey = "AIzaSyDBP2H5tSq7qb-SxMTogqUpz9ibxpWbEaA";

if (!apiKey) {
  // This is a helpful error message for the user.
  // In a real application, you would use a more secure method like environment variables.
  alert("Please add your Gemini API key to services/geminiService.ts to use the app.");
  throw new Error("API_KEY is not set. Please add your key to services/geminiService.ts");
}


const ai = new GoogleGenAI({ apiKey: apiKey });

interface GenerateQuestionOptions {
    askedQuestions?: string[];
    resumeText?: string;
}

export const generateInterviewQuestion = async (options: GenerateQuestionOptions): Promise<string> => {
  const resumeContext = options.resumeText 
    ? `The candidate's resume is provided below. You MUST generate a question that DIRECTLY asks about a specific project, skill, or experience from the resume. For example, "Tell me about your role in the X project at Y company" or "Can you elaborate on your experience with Z technology listed on your resume?". This is a strict requirement for a personalized interview. \n\nRESUME:\n${options.resumeText}`
    : `The question should be for a generic mid-level software engineer role.`;

  const prompt = `
    You are an expert technical interviewer. Your task is to generate a single, common behavioral or technical interview question for a software engineer.
    ${resumeContext}
    The question should be concise and clear.
    Do NOT provide any preamble or explanation, just the question text itself.
    To avoid repetition, do not ask any of the following questions that have already been asked:
    ${options.askedQuestions?.join('\n')}
  `;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
        }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating interview question:", error);
    throw new Error("Could not generate a new question from the AI.");
  }
};

export const analyzeAnswer = async (question: string, answer: string, resumeText?: string): Promise<Analysis> => {
    const resumeContext = resumeText
    ? `The candidate has provided their resume below. This is the single source of truth for their experience.
    \n\n---START RESUME---\n${resumeText}\n---END RESUME---\n\n`
    : `The candidate has not provided a resume.`;

  const prompt = `
    You are an expert interview coach for software engineers. Your task is to provide a detailed, constructive analysis of a candidate's answer to an interview question.

    **Interview Question:**
    "${question}"

    **Candidate's Answer:**
    "${answer}"

    ${resumeContext}

    **Analysis Instructions:**
    You must perform the following analysis and return it in a valid JSON object matching the schema.

    1.  **Score**: Assign a satisfaction score from 0 to 100.
    2.  **Strengths**: A brief, encouraging summary of what the candidate did well.
    3.  **Areas for Improvement**: Identify specific, actionable areas for improvement. Provide a category (e.g., 'Clarity', 'STAR Method', 'Technical Depth') and concrete feedback.
    4.  **Suggested Answers**: Craft two distinct model answers:

        - **For "suggestedAnswerProfessional"**:
          - **MANDATORY REQUIREMENT**: If a resume was provided (check for "---START RESUME---"), you are **REQUIRED** to use the candidate's specific experiences, projects, skills, and job titles from that resume to construct the answer.
          - **DO NOT** provide a generic answer. The answer **MUST** feel like it came from the person who wrote the resume.
          - **Example of what to do**: If the resume mentions "led the backend development for Project Titan using Go," your answer could be, "In my role leading the backend for Project Titan, I utilized Go to..."
          - **Example of what NOT to do**: "In my previous role, I worked on a challenging project..." (This is too generic).
          - The answer must be simple, direct, and concise.

        - **For "suggestedAnswerFresher"**:
          - Craft a model answer for a candidate with no professional experience (a student or "fresher").
          - This answer should focus on academic projects, internships, or transferable skills.
          - The answer must be simple, direct, and concise.
  `;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: {
                        type: Type.INTEGER,
                        description: "Satisfaction score from 0 to 100 based on the answer's quality.",
                    },
                    strengths: {
                        type: Type.STRING,
                        description: "A concise summary of the answer's strengths, starting with a positive note.",
                    },
                    areasForImprovement: {
                        type: Type.ARRAY,
                        description: "A list of categorized feedback points for improvement.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                category: { 
                                    type: Type.STRING,
                                    description: "The category of the feedback (e.g., 'Clarity', 'STAR Method')."
                                },
                                feedback: {
                                    type: Type.STRING,
                                    description: "Specific, actionable feedback for this category."
                                }
                            },
                            required: ["category", "feedback"],
                        }
                    },
                    suggestedAnswerFresher: {
                        type: Type.STRING,
                        description: "An ideal, simple, and concise model answer for a candidate with no professional experience (fresher), focusing on academic projects and skills.",
                    },
                    suggestedAnswerProfessional: {
                        type: Type.STRING,
                        description: "An ideal, simple, and concise model answer for a candidate with professional experience. If a resume was provided, this answer MUST be grounded in its content, referencing specific projects and skills.",
                    }
                },
                required: ["score", "strengths", "areasForImprovement", "suggestedAnswerFresher", "suggestedAnswerProfessional"],
            },
        },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Basic validation
    if (typeof parsedJson.score !== 'number' || typeof parsedJson.suggestedAnswerFresher !== 'string' || typeof parsedJson.suggestedAnswerProfessional !== 'string') {
        throw new Error("AI response did not match the expected format.");
    }
    
    return parsedJson as Analysis;

  } catch (error) {
    console.error("Error analyzing answer:", error);
    throw new Error("Could not get analysis from the AI.");
  }
};