export interface PostalRouteRule {
  id: string;
  name: string;
  era: string;
  startYear: number | null;
  endYear: number | null;
  description?: string;
  origin: string;
  destination: string;
  transitCities: string[];
  typicalDurationDays: number | null;
  minDurationDays: number | null;
  maxDurationDays: number | null;
  transportType: TransportType;
  frequency?: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransportType = 'land' | 'water' | 'rail' | 'air' | 'mixed';

export interface TransitCity {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  province?: string;
  era: string;
  importance: 'primary' | 'secondary' | 'tertiary';
  roles: TransitRole[];
  description?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransitRole = 'hub' | 'border' | 'port' | 'railway_station' | 'customs' | 'relay';

export interface RestrictedArea {
  id: string;
  name: string;
  era: string;
  startYear: number | null;
  endYear: number | null;
  restrictionType: RestrictionType;
  areaType: AreaType;
  locationNames: string[];
  description?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export type RestrictionType = 'prohibited' | 'restricted' | 'suspended';
export type AreaType = 'city' | 'region' | 'border' | 'route';

export interface TransitDuration {
  id: string;
  fromCity: string;
  toCity: string;
  era: string;
  transportType: TransportType;
  typicalDays: number;
  minDays: number | null;
  maxDays: number | null;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InferredRoute {
  id: string;
  letterId: string;
  name: string;
  confidence: number;
  postmarks: InferredPostmark[];
  evidences: InferenceEvidence[];
  totalDurationDays: number | null;
  totalDistanceKm: number | null;
  createdAt: string;
}

export interface InferredPostmark {
  id: string;
  type: 'origin' | 'transit' | 'destination';
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  postmarkDate: string | null;
  clarity: 'clear' | 'partial' | 'fuzzy' | 'inferred';
  sequence: number;
  isInferred: boolean;
  inferenceReason?: string;
}

export interface InferenceEvidence {
  type: EvidenceType;
  description: string;
  weight: number;
  supporting: boolean;
  ruleId?: string;
  ruleName?: string;
}

export type EvidenceType =
  | 'route_rule_match'
  | 'transit_city_match'
  | 'duration_match'
  | 'restriction_check'
  | 'geographic_logic'
  | 'clarity_discount'
  | 'historical_source';

export interface InferenceResult {
  letterId: string;
  routes: InferredRoute[];
  analysisSummary: InferenceSummary;
}

export interface InferenceSummary {
  totalRulesConsidered: number;
  matchingRules: number;
  knownTransitCities: number;
  restrictedAreasAvoided: number;
  durationConsistency: 'high' | 'medium' | 'low';
  overallConfidence: number;
  warnings: string[];
}

export interface EraFilter {
  startYear: number | null;
  endYear: number | null;
  eraName?: string;
}

export interface NetworkNode {
  name: string;
  latitude: number | null;
  longitude: number | null;
  importance: 'primary' | 'secondary' | 'tertiary';
  roles: TransitRole[];
  connectionCount: number;
  province?: string;
  description?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  typicalDays: number | null;
  transportType: TransportType;
  frequency?: string;
  ruleCount: number;
  routeNames: string[];
}

export interface EraNetworkAnalysis {
  eraLabel: string;
  startYear: number | null;
  endYear: number | null;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  hubCities: NetworkNode[];
  trunkRoutes: NetworkEdge[];
  restrictedAreas: RestrictedArea[];
  averageDuration: number | null;
  totalRoutes: number;
  totalCities: number;
  durationByTransport: { type: TransportType; avgDays: number; count: number }[];
}

export interface CityEraComparison {
  cityName: string;
  eras: {
    eraLabel: string;
    startYear: number | null;
    endYear: number | null;
    importance: 'primary' | 'secondary' | 'tertiary';
    roles: TransitRole[];
    connectionCount: number;
    outgoingRoutes: number;
    incomingRoutes: number;
    avgDuration: number | null;
  }[];
  roleChanges: string[];
  importanceChange: 'up' | 'down' | 'stable';
}

export interface TimelineDataPoint {
  year: number;
  routeCount: number;
  cityCount: number;
  avgDuration: number | null;
  restrictedAreaCount: number;
}
