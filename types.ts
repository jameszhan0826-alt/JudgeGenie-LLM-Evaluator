export interface EvaluationMetric {
  score: number;
  reasoning: string;
}

export interface EvaluationResult {
  accuracy: EvaluationMetric;
  completeness: EvaluationMetric;
  structure: EvaluationMetric;
  coverage: EvaluationMetric;
  overallScore: number;
  overallComment: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING_SUMMARY = 'GENERATING_SUMMARY',
  EVALUATING = 'EVALUATING',
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}