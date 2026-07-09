export interface RoadmapAction {
  id: string;
  title: string;
  description: string;
  dimensionId: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  successMetrics: string[];
  dependencies?: string[]; // IDs of actions this depends on
}

export interface RoadmapPhase {
  id: string;
  name: string;
  timeframe: string;
  description: string;
  actions: RoadmapAction[];
}

export interface Roadmap {
  orgName: string;
  industry: string;
  overallScore: number;
  aiReadinessScore: number;
  phases: RoadmapPhase[];
  quickWins: RoadmapAction[];
  criticalGaps: string[];
  generatedAt: number;
}
