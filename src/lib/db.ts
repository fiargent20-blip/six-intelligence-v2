import Dexie, { type EntityTable } from 'dexie';

export interface Meeting {
  id?: number;
  title: string;
  date: string;
  duration: string;
  createdAt: number;
  summary?: string;
  insights?: any[];
  
  // New Layout Fields
  strategicSummary?: string;
  coreObjectives?: string[];
  backgroundContext?: string[];
  
  transcript?: any[];
  actions?: any[];
  currentLang?: string;
  translations?: Record<string, any>;
}

export interface UserSettings {
  id?: number;
  companyName: string;
  brandColor: string;
  logoDataUrl: string | null;
  language?: "GB" | "US";
  connectedApps?: string[];
  connectedMeetings?: string[];
  deploymentMode?: "local" | "hybrid" | "cloud";
}

const db = new Dexie('SixIntelligenceScribe') as Dexie & {
  meetings: EntityTable<Meeting, 'id'>,
  settings: EntityTable<UserSettings, 'id'>
};

// Schema declaration
db.version(1).stores({
  meetings: '++id, title, date, createdAt',
  settings: '++id, companyName' 
});

export { db };
