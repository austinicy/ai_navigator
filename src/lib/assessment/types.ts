export interface Evidence {
  id: string;
  text: string;
  source: "conversation" | "document";
  dimensionId: string;
  criterionId?: string;
  timestamp: number;
  strength?: number; // 0–1, default 0.5 (conversation) / 0.8 (document)
  weight?: number;   // default 1; multiplier on strength
}

export interface DimensionAssessment {
  dimensionId: string;
  score: number; // 1-5, can be decimal
  confidence: number; // 0-1
  evidence: Evidence[];
  gaps: string[];
  criterionScores: Record<string, number>; // criterionId → score
  criterionConfidence: Record<string, number>; // criterionId → 0-1
}

export interface OrgProfile {
  name: string;
  industry: string;
  size: "startup" | "smb" | "mid-market" | "enterprise";
  geography: string;
  regulatoryEnvironment: string[];
  existingInitiatives: string[];
  constraints: {
    budget?: "low" | "medium" | "high";
    timeline?: "aggressive" | "moderate" | "flexible";
    talentAvailability?: "scarce" | "moderate" | "abundant";
  };
}

/**
 * Coerce a (possibly partial) OrgProfile from an untrusted source (e.g. an
 * HTTP body) into a fully-populated one. Matches the defaults used by
 * AssessmentEngine so both paths agree on shape.
 */
export function normalizeOrgProfile(input?: Partial<OrgProfile>): OrgProfile {
  return {
    name: input?.name ?? "",
    industry: input?.industry ?? "",
    size: input?.size ?? "mid-market",
    geography: input?.geography ?? "",
    regulatoryEnvironment: input?.regulatoryEnvironment ?? [],
    existingInitiatives: input?.existingInitiatives ?? [],
    constraints: input?.constraints ?? {},
  };
}

export interface AIReadinessBreakdown {
  score: number; // 0-100
  components: Record<string, number | null>; // componentId → score (null if not yet assessed)
}

export interface AssessmentDelta {
  dimensions: Record<string, DimensionAssessment>;
  aiReadiness: AIReadinessBreakdown;
  signalsCollected: number;
  dimensionsAssessed: number;
  dimensionsRemaining: number;
  nextFocus: string;
  orgProfile: OrgProfile;
  frameworkVersion: string;
  benchmark: { overall: number | null; byDimension: Record<string, number | null> };
}

export interface AgentResponse {
  message: string;
  assessment: AssessmentDelta;
  isComplete: boolean;
  toolCalls?: ToolCallResult[];
}

export interface ToolCallResult {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  assessment?: AssessmentDelta;
}

export interface AssessmentSession {
  id: string;
  frameworkVersion: string;
  orgProfile: OrgProfile;
  dimensions: Record<string, DimensionAssessment>;
  aiReadiness: AIReadinessBreakdown;
  conversationHistory: ChatMessage[];
  documents: UploadedDocument[];
  isComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  extractedText: string;
  signals: Evidence[];
  uploadedAt: number;
}
