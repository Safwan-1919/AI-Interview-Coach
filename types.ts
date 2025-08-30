
export enum InterviewState {
  IDLE,
  GENERATING_QUESTION,
  ASKING_QUESTION,
  LISTENING,
  ANALYZING,
  SHOWING_ANALYSIS
}

export interface ImprovementArea {
  category: string;
  feedback: string;
}

export interface Analysis {
  score: number;
  strengths: string;
  areasForImprovement: ImprovementArea[];
  suggestedAnswerFresher: string;
  suggestedAnswerProfessional: string;
}