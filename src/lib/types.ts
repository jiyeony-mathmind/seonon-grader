export type Level = '상' | '중' | '하';
export type ItemType = '서술형' | '논술형';
export type RubricStatus = 'none' | 'draft' | 'approved';
export type AnswerStatus = 'uploaded' | 'read' | 'graded' | 'reported';

export interface RubricLevel { level: Level; score: number; descriptor: string }
export interface RubricSub { name: string; interval: number; levels: RubricLevel[] }
export interface RubricArea { area: string; area_score: number; subs: RubricSub[] }
export interface Rubric {
  holistic: Record<Level, string>;
  analytic: RubricArea[];
  intent?: { purpose?: string; 처음?: string; 가운데?: string; 끝?: string };
  model?: { title?: string; 처음?: string; 가운데?: string; 끝?: string };
}

export interface Item {
  id: string; title: string; grade: string | null; domain: string | null; standard: string | null;
  item_type: ItemType; prompt: string; conditions: string | null;
  rubric: Rubric | null; rubric_status: RubricStatus; rubric_source: string | null;
  approved_at: string | null; created_at: string; updated_at: string;
}

export interface Transcription {
  title: string; intro: string; body: string; conclusion: string; notes: string;
  confidence: 'high' | 'medium' | 'low' | ''; read_at?: string; edited_by_teacher?: boolean;
}
export interface ScoreRow { area: string; sub: string; level: Level; score: number; evidence: string; comment: string }
export interface Grading {
  holistic: { level: Level; reason: string };
  scores: ScoreRow[]; total: number;
  structure: { title?: boolean; intro?: boolean; body?: boolean; conclusion?: boolean };
  strengths: string[]; weaknesses: string[]; misconceptions: string[];
  illegible_impact: 'none' | 'minor' | 'major'; notes: string;
}
export interface TeacherReport {
  summary: string;
  analysis: { type: string; text: string }[];
  guidance: { title: string; what: string; how: string }[];
  practice: { name: string; method: string; frequency: string }[];
  reassessment: { prompt: string; check_points: string[] };
}
export interface ParentReport {
  summary: string;
  strengths: { title: string; text: string }[];
  practice: { title: string; text: string }[];
}
export interface Answer {
  id: string; item_id: string; student: string | null; grade: string | null; klass: string | null;
  images: string[]; status: AnswerStatus;
  transcription: Transcription | null; grading: Grading | null;
  reports: { teacher: TeacherReport; parent: ParentReport } | null;
  total: number | null; level: Level | null; last_error: { step: string; message: string; at: string } | null;
  read_at: string | null; graded_at: string | null; reported_at: string | null; sent_at: string | null;
  parent_token: string; parent_token_expires_at: string | null; created_at: string;
}
export interface Teacher { email: string; name: string; role: 'owner' | 'teacher'; user_id: string | null }
