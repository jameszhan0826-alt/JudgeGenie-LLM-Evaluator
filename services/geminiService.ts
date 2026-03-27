
import { GoogleGenAI, Type, type Schema, Modality } from "@google/genai";
import { GeminiModel, TranscriptionResult, MindMapNode, HighlightResult, SummaryJudgeResult, TranscriptComparisonResult, InfographicData, EmotionAnalysisResult } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Judges the quality of a summary based on the transcript.
 */
export const judgeSummary = async (transcript: string, summary: string, model: GeminiModel): Promise<SummaryJudgeResult> => {
  try {
    const ai = getAiClient();
    
    const judgeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Score from 1 to 10" },
        feedback: { type: Type.STRING },
        suggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["score", "feedback", "suggestions"],
    };

    const prompt = `You are a Quality Assurance Specialist. 
    Evaluate the following summary based on the provided meeting transcript.
    
    Transcript:
    ${transcript}
    
    Summary:
    ${summary}
    
    Provide a score (1-10), detailed feedback on accuracy and completeness, and specific suggestions for improvement.
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: judgeSchema,
        temperature: 0.1,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as SummaryJudgeResult;

  } catch (error) {
    console.error("Summary Judge Error:", error);
    throw error;
  }
};

/**
 * Compares a generated transcript with a reference transcript.
 */
export const compareTranscripts = async (reference: string, generated: string, model: GeminiModel): Promise<TranscriptComparisonResult> => {
  try {
    const ai = getAiClient();
    
    const compareSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        accuracyScore: { type: Type.NUMBER, description: "Accuracy score from 0 to 100" },
        differences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["insertion", "deletion", "substitution"] },
              original: { type: Type.STRING },
              generated: { type: Type.STRING },
              timestamp: { type: Type.STRING },
            },
            required: ["type", "original", "generated"],
          }
        },
        overallFeedback: { type: Type.STRING },
      },
      required: ["accuracyScore", "differences", "overallFeedback"],
    };

    const prompt = `You are a Transcription Auditor. 
    Compare the following AI-generated transcript against the provided reference (ground truth) transcript.
    
    Reference Transcript:
    ${reference}
    
    Generated Transcript:
    ${generated}
    
    Identify insertions, deletions, and substitutions. Provide an overall accuracy score (0-100) and feedback.
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: compareSchema,
        temperature: 0.1,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as TranscriptComparisonResult;

  } catch (error) {
    console.error("Transcript Comparison Error:", error);
    throw error;
  }
};

/**
 * Generates a mind map structure from a transcript.
 */
export const generateMindMap = async (transcript: string, model: GeminiModel): Promise<MindMapNode> => {
  try {
    const ai = getAiClient();
    
    const mindMapSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        children: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                  },
                  required: ["name"],
                }
              }
            },
            required: ["name"],
          }
        }
      },
      required: ["name"],
    };

    const prompt = `You are a Visual Information Architect. 
    Create a hierarchical Mind Map structure from this meeting transcript.
    The root should be the main meeting topic.
    The first level of children should be the main themes or agenda items.
    The second level should be specific sub-points or details.
    
    IMPORTANT: For all 'name' fields, provide the FULL, COMPLETE, and DETAILED text. Do not truncate or summarize.
    
    Transcript:
    ${transcript}
    
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mindMapSchema,
        temperature: 0.1,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as MindMapNode;

  } catch (error) {
    console.error("Mind Map Error:", error);
    throw error;
  }
};

/**
 * Identifies key highlights from a transcript with timestamps.
 */
export const identifyVideoHighlights = async (vttTranscript: string, model: GeminiModel): Promise<HighlightResult> => {
  try {
    const ai = getAiClient();
    
    const highlightSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        segments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.NUMBER, description: "Start time in seconds" },
              endTime: { type: Type.NUMBER, description: "End time in seconds" },
              description: { type: Type.STRING },
            },
            required: ["startTime", "endTime", "description"],
          }
        }
      },
      required: ["summary", "segments"],
    };

    const prompt = `You are a Video Editor. 
    Analyze this WebVTT transcript and identify the most important "Highlights".
    The goal is to create a "Quick View" summary that captures the essence of the meeting in roughly 5 minutes of total footage.
    
    TASK:
    1. Provide a brief summary of what these highlights cover.
    2. Identify specific segments (start and end times in TOTAL SECONDS from the very beginning of the video) that are most critical.
    3. Ensure the total duration of segments is around 300 seconds (5 minutes) if the meeting is long.
    4. IMPORTANT: The timestamps must be absolute seconds from 0. For example, if a highlight is at 10 minutes, startTime should be 600.
    5. CRITICAL: Look at the final timestamp in the WebVTT file. NEVER return a startTime or endTime that is larger than the final timestamp in the transcript.
    6. CRITICAL: If the meeting is only 30 minutes long, your timestamps should NEVER be in the 1-hour range (3600+ seconds).
    
    Transcript (WebVTT):
    ${vttTranscript}
    
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: highlightSchema,
        temperature: 0.1,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as HighlightResult;

  } catch (error) {
    console.error("Highlights Error:", error);
    throw error;
  }
};

/**
 * Generates a summary using the selected model.
 */
export const generateMeetingSummary = async (transcript: string, model: GeminiModel, optimizePrompt?: boolean, filename?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const contextInfo = filename ? `Meeting Title/File: ${filename}` : '';
    const prompt = optimizePrompt 
      ? `Optimize the following prompt for best results, then perform the task:
      
      You are a professional scribe. Create a detailed summary from this meeting transcript.
      ${contextInfo}
      
      Structure:
      - **Meeting Notes**: Synthesize key discussions.
      - **Action Items**: Explicit task list with owners.

      Transcript:
      ${transcript}`
      : `You are a professional scribe. Create a detailed summary from this meeting transcript.
      ${contextInfo}
      
      Structure:
      - **Meeting Notes**: Synthesize key discussions.
      - **Action Items**: Explicit task list with owners.

      Transcript:
      ${transcript}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.2,
        ...( (model === 'gemini-3-pro-preview' || model === 'gemini-3.1-pro-preview') ? { thinkingConfig: { thinkingBudget: 4000 } } : {})
      }
    });

    if (response.text) {
      return response.text;
    }
    throw new Error("Empty response from Generator");
  } catch (error) {
    console.error("Generator Error:", error);
    throw error;
  }
};

/**
 * Transcribes a video or audio file.
 */
export const transcribeMedia = async (base64Data: string, mimeType: string, model: GeminiModel): Promise<TranscriptionResult> => {
  try {
    const ai = getAiClient();
    
    const transcriptionSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        plainText: { type: Type.STRING },
        vtt: { type: Type.STRING },
      },
      required: ["plainText", "vtt"],
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { text: "Please provide a verbatim transcript of this recording. CRITICAL: You MUST identify different speakers and use their FULL NAMES (e.g., 'Andy Cooper', 'Sarah Jenkins') whenever they are mentioned or can be inferred from the conversation. Do NOT use generic labels like 'Speaker A' if a name is available. Provide the transcript in two formats: 1. Plain text with full speaker names. 2. WebVTT format with accurate timestamps and speaker identification." },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: transcriptionSchema,
      }
    });

    if (response.text) {
      const cleanedJson = response.text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedJson) as TranscriptionResult;
    }
    throw new Error("Empty response from Transcriber");
  } catch (error) {
    console.error("Transcriber Error:", error);
    throw error;
  }
};

/**
 * Generates an audio recap of the highlights.
 */
export const generateAudioRecap = async (highlights: HighlightResult): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Step 1: Generate the script text using a standard model
    const scriptPrompt = `Create a short, professional, and engaging script for a meeting recap based on these highlights. 
    The script should be suitable for text-to-speech conversion. 
    Keep it under 150 words.
    
    Summary: ${highlights.summary}
    Highlights: ${highlights.segments.map(s => s.description).join('. ')}`;

    const scriptResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: scriptPrompt,
      config: {
        temperature: 0.7,
      }
    });

    const scriptText = scriptResponse.text;
    if (!scriptText) throw new Error("Failed to generate recap script");

    // Step 2: Convert the script text to audio using the TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this: ${scriptText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("Empty audio response from TTS");
  } catch (error) {
    console.error("Audio Recap Error:", error);
    throw error;
  }
};

/**
 * Generates structured data for an infographic.
 */
export const generateInfographicData = async (transcript: string, model: GeminiModel): Promise<InfographicData> => {
  try {
    const ai = getAiClient();
    
    const infographicSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["stat", "point", "action"] },
              icon: { type: Type.STRING, description: "A simple keyword for an icon (e.g., 'check', 'star', 'alert')" },
            },
            required: ["label", "value", "type"],
          }
        }
      },
      required: ["title", "summary", "items"],
    };

    const prompt = `You are a Graphic Designer. 
    Analyze this meeting transcript and extract key information to be displayed in an infographic.
    Identify:
    1. A catchy title.
    2. A one-sentence summary.
    3. Key statistics (if any), main points, and critical action items.
    
    IMPORTANT: Be creative and extract meaningful data. If there are no explicit numbers, use "main points" or "key takeaways" as labels.
    
    Transcript:
    ${transcript}
    
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: infographicSchema,
        temperature: 0.1,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as InfographicData;

  } catch (error) {
    console.error("Infographic Data Error:", error);
    throw error;
  }
};

/**
 * Analyzes the meeting transcript and audio for participant emotions and dynamics.
 */
export const analyzeMeetingEmotion = async (transcript: string, model: GeminiModel): Promise<EmotionAnalysisResult> => {
  try {
    const ai = getAiClient();
    
    const emotionSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        participants: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dominantEmotion: { type: Type.STRING, enum: ["happy", "angry", "neutral", "excited", "frustrated"] },
              emotionTrend: { type: Type.STRING },
            },
            required: ["name", "dominantEmotion", "emotionTrend"],
          }
        },
        conflictDetected: { type: Type.BOOLEAN },
        consensusReached: { type: Type.BOOLEAN },
        aiHostReport: { type: Type.STRING },
      },
      required: ["summary", "participants", "conflictDetected", "consensusReached", "aiHostReport"],
    };

    const prompt = `You are an AI Meeting Host. 
    Analyze the following meeting transcript to observe and summarize the emotional dynamics of the participants.
    
    Transcript:
    ${transcript}
    
    1. Provide a summary of the emotional tone of the meeting.
    2. Identify each participant, their dominant emotion, and how their emotion evolved (emotionTrend).
    3. Detect if there was any conflict and if a consensus was reached.
    4. Provide a report as an AI Host, summarizing your observations.
    
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: emotionSchema,
        temperature: 0.2,
      }
    });

    let jsonText = response.text || "";
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as EmotionAnalysisResult;

  } catch (error) {
    console.error("Emotion Analysis Error:", error);
    throw error;
  }
};
