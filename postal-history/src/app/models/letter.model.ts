export type PostmarkType = 'origin' | 'destination' | 'transit';
export type PostmarkClarity = 'clear' | 'fuzzy' | 'partial';

export interface Postmark {
  id: string;
  letterId: string;
  type: PostmarkType;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  postmarkDate: string | null;
  clarity: PostmarkClarity;
  notes?: string;
  sequence: number;
}

export interface Letter {
  id: string;
  title: string;
  description?: string;
  postmarks: Postmark[];
  createdAt: string;
  updatedAt: string;
}

export interface RouteSegment {
  from: Postmark;
  to: Postmark;
  durationDays: number | null;
  distanceKm: number | null;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  postmarkId?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  postmarkId?: string;
}

export interface CityStat {
  name: string;
  count: number;
}

export interface DurationStat {
  label: string;
  value: number;
}
