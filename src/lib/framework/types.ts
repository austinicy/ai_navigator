export interface LevelDescriptor {
  [level: string]: string; // "1" through "5" → description text
}

export interface CriterionConfig {
  id: string;
  name: string;
  weight: number;
  aiReadinessComponent?: string; // maps to AI readiness component
  levels: LevelDescriptor;
  benchmarkTarget?: number; // 1–5: typical industry-peer level (v2+)
  dependsOn?: string[]; // other criterion ids that should precede this (v2+)
}

export interface DimensionConfig {
  id: string;
  name: string;
  weight: number;
  references: string[];
  criteria: CriterionConfig[];
  weightingRationale?: string; // why this dimension weighs what it does (v2+)
}

export interface AIReadinessComponent {
  id: string;
  name: string;
  sourceDimension: string;
  description: string;
  weight?: number; // default 1 (v2+)
}

export interface FrameworkConfig {
  version: string;
  name: string;
  description: string;
  dimensions: DimensionConfig[];
  aiReadinessComponents: AIReadinessComponent[];
  evidenceThreshold: number; // minimum evidence items per dimension
  confidenceThreshold: number; // minimum confidence (0-1) per dimension
  referenceFrameworks: Record<string, string>; // name → source
  versionNotes?: string; // what changed vs prior version (v2+)
}
