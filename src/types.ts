export type ThreatZone = 
  | 'Input Surfaces'
  | 'Planning & Reasoning'
  | 'Tool Execution'
  | 'Memory & State'
  | 'Inter-System Communication';

export interface ThreatZoneDetail {
  zone: ThreatZone;
  description: string;
  keyRisks: string[];
  recommendedDefenses: string[];
  iconName: string;
}

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ThreatTableRow {
  threatZone: ThreatZone;
  threatScenario: string;
  owaspCategory: string;
  severity: RiskSeverity;
  countermeasure: string;
}

export interface SecurityVulnerability {
  severity: RiskSeverity;
  title: string;
  owaspCategory: string;
  dataFlowVector: string;
  remediation: string;
  codeDiff?: {
    original: string;
    remediated: string;
  };
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  type: 'threat_model' | 'security_review' | 'walkthrough' | 'gemini_execution';
  inputSummary: string;
  modelUsed: string;
  fallbackTrace: string[];
  latencyMs: number;
  status: 'success' | 'recovered' | 'failed';
  sanitizedPayload: any;
  resultSummary?: string;
  threatZoneMatches?: string[];
  securityFlagsDetected?: string[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  env: {
    hasGeminiApiKey: boolean;
    appUrl: string;
  };
  directives: {
    threatModelingZones: string[];
    owaspCoverages: string[];
    fallbackLadder: string[];
    secretManagerCompliance: boolean;
    firestoreSecurityIsolation: boolean;
  };
}

export interface TestCaseWalkthrough {
  id: string;
  title: string;
  trigger: string;
  preconditions: string;
  expectedAssertions: string[];
  severity: 'P0' | 'P1' | 'P2';
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  fallbackTrace?: string[];
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  tags?: string[];
  mood?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface CognitiveNode {
  id: string;
  label: string;
  category: 'goal' | 'challenge' | 'insight' | 'habit' | 'decision';
  strength: number;
  description: string;
}

export interface CognitiveEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

export interface RadarMetrics {
  cognitiveClarity: number;
  strategicFocus: number;
  energyVelocity: number;
  emotionalResilience: number;
  executionMomentum: number;
}

export interface MicroHabit {
  id: string;
  title: string;
  trigger: string;
  rationale: string;
  frequency: string;
  completed?: boolean;
}

export interface CognitiveGraphData {
  nodes: CognitiveNode[];
  edges: CognitiveEdge[];
  radarMetrics: RadarMetrics;
  mindsetTrajectory: string;
  microHabits: MicroHabit[];
  socraticInquiry: string;
}

export interface SentimentTrendPoint {
  sessionId: string;
  sessionTitle: string;
  date: string;
  timestamp: number;
  sentimentScore: number; // 0 to 100
  primaryEmotion: string;
  intensity: number;
  keyTrigger: string;
  snippet: string;
}

export interface EmotionBreakdownItem {
  emotion: string;
  percentage: number;
  color: string;
}

export interface SentimentInflectionPoint {
  sessionId: string;
  sessionTitle: string;
  date: string;
  type: 'positive_breakthrough' | 'stress_peak' | 'resilient_recovery';
  title: string;
  description: string;
  scoreDelta: string;
}

export interface SentimentAnalysisData {
  overallSentiment: {
    score: number;
    label: string;
    summary: string;
    emotionalVolatility: 'Low' | 'Moderate' | 'Elevated';
    burnoutRisk: 'Low' | 'Moderate' | 'Elevated';
    resilienceScore: number;
  };
  trendPoints: SentimentTrendPoint[];
  emotionBreakdown: EmotionBreakdownItem[];
  inflectionPoints: SentimentInflectionPoint[];
  actionableWellnessInsights: string[];
}

