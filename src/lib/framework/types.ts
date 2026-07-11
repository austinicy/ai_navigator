export interface LevelDescriptor {
  [level: string]: string; // "1" through "5" → description text
}

export interface CriterionConfig {
  id: string;
  name: string;
  weight: number;
  aiReadinessComponent?: string; // maps to AI readiness component
  genAIReadinessComponent?: string; // maps to GenAI/agentic readiness (v3+)
  levels: LevelDescriptor;
  benchmarkTarget?: number; // 1–5: typical industry-peer level (v2+)
  targetLevel?: number; // 1–5: recommended capability target, not an empirical benchmark (v3+)
  dependsOn?: string[]; // other criterion ids that should precede this (v2+)
  sourceIds?: string[]; // traceable sources supporting this criterion (v3+)
}

export interface DimensionConfig {
  id: string;
  name: string;
  weight: number;
  references: string[];
  criteria: CriterionConfig[];
  weightingRationale?: string; // why this dimension weighs what it does (v2+)
  includeInOverall?: boolean; // false for cross-cutting capability modules (v3+)
  sourceIds?: string[]; // traceable sources supporting this dimension (v3+)
}

export interface AIReadinessComponent {
  id: string;
  name: string;
  sourceDimension: string;
  description: string;
  weight?: number; // default 1 (v2+)
}

export type ReferenceSourceType =
  | "standard"
  | "regulation"
  | "risk-framework"
  | "maturity-model"
  | "architecture-guidance"
  | "research";

export interface ReferenceSource {
  id: string;
  publisher: string;
  title: string;
  url: string;
  sourceType: ReferenceSourceType;
  publicationDate?: string;
  scope: string;
}

export interface FrameworkConfig {
  version: string;
  name: string;
  description: string;
  dimensions: DimensionConfig[];
  aiReadinessComponents: AIReadinessComponent[];
  genAIReadinessComponents?: AIReadinessComponent[]; // v3+
  evidenceThreshold: number; // minimum evidence items per dimension
  confidenceThreshold: number; // minimum confidence (0-1) per dimension
  referenceFrameworks: Record<string, string>; // name → source
  referenceSources?: ReferenceSource[]; // structured provenance ledger (v3+)
  versionNotes?: string; // what changed vs prior version (v2+)
}
