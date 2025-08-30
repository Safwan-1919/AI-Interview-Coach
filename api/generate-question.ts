// This file is a serverless function and runs on the backend.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
    const { askedQuestions, resumeText } = request.body;

    const resumeContext = resumeText 
      ? `The candidate's resume is provided below. You MUST generate a question that DIRECTLY asks about a specific project, skill, or experience from the resume. For example, "Tell me about your role in the X project at Y company" or "Can you elaborate on your experience with Z technology listed on your resume?". This is a strict requirement for a personalized interview. \n\nRESUME:\n${resumeText}`
      : `The question should be for a generic mid-level software engineer role.`;

    const prompt = `
      You are an expert technical interviewer. Your task is to generate a single, common behavioral or technical interview question for a software engineer.
      ${resumeContext}
      The question should be concise and clear.
      Do NOT provide any preamble or explanation, just the question text itself.
      To avoid repetition, do not ask any of the following questions that have already been asked:
      ${(askedQuestions as string[])?.join('\n')}
    `;
    
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
        }
    });
    
    const question = geminiResponse.text.trim();

    return response.status(200).json({ question });

  } catch (error) {
    console.error("Error in generate-question handler:", error);
    return response.status(500).json({ message: 'Failed to generate question from the AI.' });
  }
}
