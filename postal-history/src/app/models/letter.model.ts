export type PostmarkType = 'origin' | 'destination' | 'transit';
export type PostmarkClarity = 'clear' | 'fuzzy' | 'partial';
export type LocationPrecision = 'exact' | 'approximate' | 'unknown';

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
  locationPrecision?: LocationPrecision;
}

export interface RouteVersion {
  id: string;
  letterId: string;
  name: string;
  description?: string;
  postmarks: Postmark[];
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id: string;
  title: string;
  description?: string;
  postmarks: Postmark[];
  versions?: RouteVersion[];
  officialVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfidenceScore {
  total: number;
  maxScore: number;
  percentage: number;
  breakdown: ConfidenceBreakdown;
}

export interface ConfidenceBreakdown {
  clarity: { score: number; max: number; details: string[] };
  dateCompleteness: { score: number; max: number; details: string[] };
  locationPrecision: { score: number; max: number; details: string[] };
  temporalOrder: { score: number; max: number; details: string[] };
  routeContinuity: { score: number; max: number; details: string[] };
}

export type RouteDiffType = 'added' | 'removed' | 'modified' | 'same';

export interface RouteDiffNode {
  postmark: Postmark;
  diffType: RouteDiffType;
  originalIndex?: number;
  comparedIndex?: number;
}

export interface RouteDiffSegment {
  from: RouteDiffNode;
  to: RouteDiffNode;
  diffType: RouteDiffType;
  distanceDiff?: number;
  durationDiff?: number;
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
