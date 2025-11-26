import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EvaluationResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a summary using the faster Gemini 2.5 Flash model.
 */
export const generateMeetingSummary = async (transcript: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a precise minute-taker. Generate a structured summary of the following transcript.
      
      Format requirements:
      - Use Markdown.
      - Section 1: "**Meeting Notes**" (Key discussion points, decisions).
      - Section 2: "**Action Items**" (Clear checklist of tasks assigned to specific people).

      Transcript:
      ${transcript}`,
      config: {
        temperature: 0.3,
      }
    });

    if (response.text) {
      return response.text;
    }
    throw new Error("No text returned from model");
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};

/**
 * Evaluates the summary using the stronger Gemini 3 Pro model (LLM-as-a-Judge).
 */
export const evaluateSummaryQuality = async (
  originalTranscript: string,
  generatedSummary: string
): Promise<EvaluationResult> => {
  try {
    const evaluationSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        accuracy: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1-10." },
            reasoning: { type: Type.STRING, description: "Specific examples of accuracy issues or confirmations." },
          },
          required: ["score", "reasoning"],
        },
        completeness: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1-10." },
            reasoning: { type: Type.STRING, description: "Specific missing items or confirmation of completeness." },
          },
          required: ["score", "reasoning"],
        },
        structure: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1-10." },
            reasoning: { type: Type.STRING, description: "Comments on formatting and section separation." },
          },
          required: ["score", "reasoning"],
        },
        overallScore: { type: Type.NUMBER, description: "Overall quality score 1-10." },
        overallComment: { type: Type.STRING, description: "Final verdict summary." },
      },
      required: ["accuracy", "completeness", "structure", "overallScore", "overallComment"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert Meeting Minute Auditor. 

      Your goal is to compare the "Generated Meeting Minutes" against the "Original Transcript" and identify any discrepancies in specific categories.

      The "Generated Meeting Minutes" are expected to have two main sections:
      1. **Meeting Notes**: A summary of the discussion.
      2. **Action Items**: A list of tasks assignments.

      EVALUATION RUBRIC:

      1. **Accuracy** (Score 1-10):
         - Focus: Hallucinations & Attribution.
         - Check: Did Speaker A actually say what is attributed to them in the Notes?
         - Check: Are Action Items assigned to the correct person? (e.g., If Transcript says "John will do X", but Action Item says "Sarah: X", this is a major error).

      2. **Completeness** (Score 1-10):
         - Focus: Omissions.
         - Check: Are there any significant decisions in the Transcript that are missing from the Notes?
         - Check: Are there any tasks agreed upon in the Transcript that are missing from the Action Items?

      3. **Structure** (Score 1-10):
         - Focus: Formatting & Organization.
         - Check: Are the headers "**Meeting Notes**" and "**Action Items**" present?
         - Check: Is the formatting clean (bullet points, bold text)?

      ORIGINAL TRANSCRIPT:
      ${originalTranscript}

      GENERATED MEETING MINUTES:
      ${generatedSummary}

      Return the JSON result.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.1,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No evaluation generated");

    const result = JSON.parse(jsonText) as EvaluationResult;
    return result;

  } catch (error) {
    console.error("Error evaluating summary:", error);
    throw error;
  }
};
