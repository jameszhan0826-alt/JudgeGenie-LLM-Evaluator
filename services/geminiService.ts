import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { EvaluationResult } from "../types";

// Helper to get initialized client safely
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates a summary using the faster Gemini 2.5 Flash model.
 */
export const generateMeetingSummary = async (transcript: string): Promise<string> => {
  try {
    const ai = getAiClient();
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
    const ai = getAiClient();
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
        coverage: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1-10." },
            reasoning: { type: Type.STRING, description: "Assessment of topic breadth and balance." },
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
      required: ["accuracy", "completeness", "coverage", "structure", "overallScore", "overallComment"],
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
         - Check: Are Action Items assigned to the correct person?

      2. **Completeness** (Score 1-10):
         - Focus: Omissions of Details.
         - Check: Are there any specific decisions, dates, or numbers in the Transcript that are missing from the Notes?
         - Check: Are there any specific tasks agreed upon that are missing from the Action Items?

      3. **Coverage** (Score 1-10):
         - Focus: Topic Breadth & Balance.
         - Check: Did the summary cover all the distinct agenda items or discussion threads found in the transcript?
         - Check: Is the summary balanced, or does it overly focus on one minor part of the conversation while ignoring others?

      4. **Structure** (Score 1-10):
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

    let jsonText = response.text;
    if (!jsonText) throw new Error("No evaluation generated");

    // Clean up markdown code blocks if present
    if (jsonText.includes("```json")) {
      jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "");
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.replace(/```/g, "");
    }

    const result = JSON.parse(jsonText) as EvaluationResult;
    return result;

  } catch (error) {
    console.error("Error evaluating summary:", error);
    throw error;
  }
};