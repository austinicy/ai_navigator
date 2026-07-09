export interface Evidence {
  id: string;
  text: string;
  source: "conversation" | "document";
  dimensionId: string;
  criterionId?: string;
  timestamp: number;
}

export interface DimensionAssessment {
  dimensionId: string;
  score: number; // 1-5, can be decimal
  confidence: number; // 0-1
  evidence: Evidence[];
  gaps: string[];
  criterionScores: Record<string, number>; // criterionId → score
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
