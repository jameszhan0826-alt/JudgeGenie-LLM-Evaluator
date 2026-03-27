
export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING_SUMMARY = 'GENERATING_SUMMARY',
  TRANSCRIBING = 'TRANSCRIBING',
  GENERATING_MINDMAP = 'GENERATING_MINDMAP',
  GENERATING_HIGHLIGHTS = 'GENERATING_HIGHLIGHTS',
  JUDGING_SUMMARY = 'JUDGING_SUMMARY',
  COMPARING_TRANSCRIPT = 'COMPARING_TRANSCRIPT',
  GENERATING_AUDIO_RECAP = 'GENERATING_AUDIO_RECAP',
  GENERATING_INFOGRAPHIC = 'GENERATING_INFOGRAPHIC',
  ANALYZING_EMOTION = 'ANALYZING_EMOTION',
}

export interface EmotionAnalysisResult {
  summary: string;
  participants: {
    name: string;
    dominantEmotion: 'happy' | 'angry' | 'neutral' | 'excited' | 'frustrated';
    emotionTrend: string;
  }[];
  conflictDetected: boolean;
  consensusReached: boolean;
  aiHostReport: string;
}

export interface SummaryJudgeResult {
  score: number; // 1-10
  feedback: string;
  suggestions: string[];
}

export interface TranscriptComparisonResult {
  accuracyScore: number; // 0-100
  differences: {
    type: 'insertion' | 'deletion' | 'substitution';
    original: string;
    generated: string;
    timestamp?: string;
  }[];
  overallFeedback: string;
}

export interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

export interface HighlightSegment {
  startTime: number; // in seconds
  endTime: number; // in seconds
  description: string;
}

export interface HighlightResult {
  segments: HighlightSegment[];
  summary: string;
}

export interface InfographicItem {
  label: string;
  value: string;
  type: 'stat' | 'point' | 'action';
  icon?: string;
}

export interface InfographicData {
  title: string;
  items: InfographicItem[];
  summary: string;
}

export interface TranscriptionResult {
  plainText: string;
  vtt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  filename?: string;
  fileSize?: number;
  transcript: string;
  vttTranscript?: string;
  summary?: string;
  mindMapData?: MindMapNode;
  highlights?: HighlightResult;
  summaryJudge?: SummaryJudgeResult;
  transcriptComparison?: TranscriptComparisonResult;
  audioRecap?: string; // base64 audio
  infographicData?: InfographicData;
  emotionData?: EmotionAnalysisResult;
  generatorModel?: GeminiModel;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export type GeminiModel = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3-pro-preview' 
  | 'gemini-flash-lite-latest'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3.1-pro-preview';
