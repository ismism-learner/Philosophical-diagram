export interface VisualConcept {
  conceptTitle: string;
  explanation: string;
  visualPrompt: string;
}

export interface GeneratedResult {
  id: string;
  concept: VisualConcept;
  imageUrl: string | null;
  isLoading: boolean;
  error?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}