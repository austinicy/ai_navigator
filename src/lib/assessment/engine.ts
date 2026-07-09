import { v4 as uuidv4 } from "uuid";
import { loadFramework, getDimensionById } from "../framework/config";
import { FrameworkConfig } from "../framework/types";
import { calculateAIReadinessScore } from "./scoring";
import {
  AssessmentSession,
  DimensionAssessment,
  Evidence,
  OrgProfile,
  AssessmentDelta,
  UploadedDocument,
} from "./types";

export class AssessmentEngine {
  private session: AssessmentSession;
  private config: FrameworkConfig;

  constructor(orgProfile?: Partial<OrgProfile>) {
    this.config = loadFramework();
    this.session = {
      id: uuidv4(),
      frameworkVersion: this.config.version,
      orgProfile: {
        name: orgProfile?.name ?? "",
        industry: orgProfile?.industry ?? "",
        size: orgProfile?.size ?? "mid-market",
        geography: orgProfile?.geography ?? "",
        regulatoryEnvironment: orgProfile?.regulatoryEnvironment ?? [],
        existingInitiatives: orgProfile?.existingInitiatives ?? [],
        constraints: orgProfile?.constraints ?? {},
      },
      dimensions: {},
      aiReadiness: { score: 0, components: {} },
      conversationHistory: [],
      documents: [],
      isComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Initialize empty dimension assessments
    for (const dim of this.config.dimensions) {
      this.session.dimensions[dim.id] = {
        dimensionId: dim.id,
        score: 0,
        confidence: 0,
        evidence: [],
        gaps: [],
        criterionScores: {},
      };
    }
  }

  getSession(): AssessmentSession {
    return this.session;
  }

  getConfig(): FrameworkConfig {
    return this.config;
  }

  addEvidence(evidence: Omit<Evidence, "id" | "timestamp">): void {
    const fullEvidence: Evidence = {
      ...evidence,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    const dim = this.session.dimensions[evidence.dimensionId];
    if (dim) {
      dim.evidence.push(fullEvidence);
    }
    this.session.updatedAt = Date.now();
  }

  updateDimensionScore(
    dimensionId: string,
    criterionScores: Record<string, number>,
    gaps: string[]
  ): void {
    const dim = this.session.dimensions[dimensionId];
    if (!dim) return;

    dim.criterionScores = { ...dim.criterionScores, ...criterionScores };
    dim.gaps = [...new Set([...dim.gaps, ...gaps])];
    dim.score = this.calculateDimScore(dimensionId);
    dim.confidence = this.calculateDimConfidence(dimensionId);
    this.session.aiReadiness = calculateAIReadinessScore(
      this.session.dimensions,
      this.config
    );
    this.session.updatedAt = Date.now();
  }

  updateOrgProfile(updates: Partial<OrgProfile>): void {
    this.session.orgProfile = { ...this.session.orgProfile, ...updates };
    this.session.updatedAt = Date.now();
  }

  addDocument(doc: Omit<UploadedDocument, "id" | "uploadedAt">): void {
    this.session.documents.push({
      ...doc,
      id: uuidv4(),
      uploadedAt: Date.now(),
    });
    // Add document signals as evidence
    for (const signal of doc.signals) {
      this.addEvidence({
        text: signal.text,
        source: "document",
        dimensionId: signal.dimensionId,
        criterionId: signal.criterionId,
      });
    }
  }

  getDelta(): AssessmentDelta {
    const dims = this.session.dimensions;
    const assessedCount = Object.values(dims).filter(
      (d) => d.confidence >= this.config.confidenceThreshold
    ).length;

    return {
      dimensions: dims,
      aiReadiness: this.session.aiReadiness,
      signalsCollected: Object.values(dims).reduce(
        (sum, d) => sum + d.evidence.length,
        0
      ),
      dimensionsAssessed: assessedCount,
      dimensionsRemaining:
        this.config.dimensions.length - assessedCount,
      nextFocus: this.getNextUnassessedDimension(),
    };
  }

  checkComplete(): boolean {
    return Object.values(this.session.dimensions).every(
      (d) => d.confidence >= this.config.confidenceThreshold
    );
  }

  markComplete(): void {
    this.session.isComplete = true;
    this.session.updatedAt = Date.now();
  }

  /** Persist a user or assistant message to the session's conversation history. */
  addConversationMessage(role: "user" | "assistant", content: string): void {
    this.session.conversationHistory.push({
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now(),
    });
    this.session.updatedAt = Date.now();
  }

  private calculateDimScore(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    const dimConfig = getDimensionById(this.config, dimensionId);
    if (!dim || !dimConfig) return 0;

    const scoredCriteria = Object.entries(dim.criterionScores);
    if (scoredCriteria.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [criterionId, score] of scoredCriteria) {
      const criterion = dimConfig.criteria.find((c) => c.id === criterionId);
      const weight = criterion?.weight ?? 1;
      weightedSum += score * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  }

  private calculateDimConfidence(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    if (!dim) return 0;
    const evidenceCount = dim.evidence.length;
    const criteriaCount = Object.keys(dim.criterionScores).length;
    const dimConfig = getDimensionById(this.config, dimensionId);
    if (!dimConfig) return 0;

    const evidenceFactor = Math.min(1, evidenceCount / this.config.evidenceThreshold);
    const criteriaFactor = Math.min(1, criteriaCount / dimConfig.criteria.length);
    return (evidenceFactor + criteriaFactor) / 2;
  }

  private getNextUnassessedDimension(): string {
    const unassessed = this.config.dimensions.filter((dim) => {
      const assessment = this.session.dimensions[dim.id];
      return assessment && assessment.confidence < this.config.confidenceThreshold;
    });
    return unassessed.length > 0 ? unassessed[0].id : "";
  }
}
