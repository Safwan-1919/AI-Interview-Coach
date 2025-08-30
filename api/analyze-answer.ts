// This file is a serverless function and runs on the backend.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    return response.status(500).json({ message: 'API key is not configured on the server.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const { question, answer, resumeText } = request.body;

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
            - **Example of what NOT to do**: "In a previous role, I worked on a challenging project..." (This is too generic).
            - The answer must be simple, direct, and concise.

          - **For "suggestedAnswerFresher"**:
            - Craft a model answer for a candidate with no professional experience (a student or "fresher").
            - This answer should focus on academic projects, internships, or transferable skills.
            - The answer must be simple, direct, and concise.
    `;
    
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
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

    const jsonText = geminiResponse.text.trim();
    
    // Vercel's 'json' helper automatically stringifies and sets the Content-Type header.
    return response.status(200).json(JSON.parse(jsonText));

  } catch (error) {
    console.error("Error in analyze-answer handler:", error);
    return response.status(500).json({ message: 'Could not get analysis from the AI.' });
  }
}
