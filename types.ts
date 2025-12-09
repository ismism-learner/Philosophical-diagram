
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
  PAUSED = 'PAUSED', // New state
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

// --- Library & Storage Types ---

export interface SavedSession {
  id: string;
  name: string; // Chapter Name
  timestamp: number;
  results: GeneratedResult[];
  mode: AppMode;
}

export type LibraryItemType = 'folder' | 'file';

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  name: string; // Book Name or Chapter Name
  children?: LibraryItem[]; // Only for folders
  data?: SavedSession; // Only for files
  createdAt: number;
}

// --- AI Service Types ---

export type AIProvider = 'gemini' | 'openai' | 'custom';

export interface AISettings {
  textProvider: AIProvider;
  textModel: string;
  textBaseUrl?: string;
  textApiKey?: string;

  imageProvider: AIProvider;
  imageModel: string;
  imageBaseUrl?: string;
  imageApiKey?: string;
}
