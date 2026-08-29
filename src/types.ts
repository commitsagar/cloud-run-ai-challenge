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

