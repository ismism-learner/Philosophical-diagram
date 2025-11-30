
export interface VisualConcept {
  conceptTitle: string;
  explanation: string;
  visualPrompt: string;
}

export enum AppMode {
  CLASSIC = 'CLASSIC', // Ancient Book / Philosophy
  MODERN = 'MODERN'   // Technical / Logical Flow
}

export enum Language {
  ZH = 'ZH',
  EN = 'EN'
}

export enum ResultStatus {
  WAITING = 'WAITING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedResult {
  id: string;
  mode: AppMode;
  sourceText: string; // The original text segment
  status: ResultStatus;
  concept?: VisualConcept; // Optional because it doesn't exist in WAITING state
  imageUrl: string | null;
  error?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING', // Combined state for the queue
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
