
export type Role = 'admin' | 'teacher' | 'student';
export type LicenseStatus = 'trial' | 'active' | 'expired' | 'unlimited';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: number;
  licenseStatus: LicenseStatus;
  licenseExpiry?: number;
}

export interface LicenseRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: number;
}

export interface Grade {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  gradeId: string;
  workImage?: string; // base64
  extractedText?: string;
  evaluation?: Evaluation;
}

export interface Evaluation {
  handwritingScore: number;
  originalityScore: number;
  punctuationErrors: string[];
  conceptKnowledge: string;
  transcribedText: string; 
  creativityScore: number;
  plagiarismNote: string;
  overallScore: number;
  weaknesses: string[];
  suggestions: {
    topic: string;
    action: string;
  }[];
}

export interface SavedReport {
  id: string;
  studentName: string;
  gradeName: string;
  timestamp: string;
  evaluation: Evaluation;
  workImage?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  isPremium: boolean;
}

export interface AppState {
  grades: Grade[];
  students: Student[];
  referenceText: string;
  savedReports: SavedReport[];
  users: User[];
  licenseRequests: LicenseRequest[];
  currentThemeId?: string;
}
