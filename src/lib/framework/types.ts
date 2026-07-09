export interface LevelDescriptor {
  [level: string]: string; // "1" through "5" → description text
}

export interface CriterionConfig {
  id: string;
  name: string;
  weight: number;
  aiReadinessComponent?: string; // maps to AI readiness component
  levels: LevelDescriptor;
}

export interface DimensionConfig {
  id: string;
  name: string;
  weight: number;
  references: string[];
  criteria: CriterionConfig[];
}

export interface AIReadinessComponent {
  id: string;
  name: string;
  sourceDimension: string;
  description: string;
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
}
