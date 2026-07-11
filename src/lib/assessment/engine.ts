import { v4 as uuidv4 } from "uuid";
import { loadFramework, getDimensionById } from "../framework/config";
import { FrameworkConfig } from "../framework/types";
import {
  calculateAIReadinessScore,
  calculateGenAIReadinessScore,
  calculateDimensionScore,
  calculateBenchmarkDelta,
} from "./scoring";
import {
  AssessmentSession,
  Evidence,
  OrgProfile,
  AssessmentDelta,
  UploadedDocument,
} from "./types";

export class AssessmentEngine {
  private session: AssessmentSession;
  private config: FrameworkConfig;

  constructor(orgProfile?: Partial<OrgProfile>, frameworkVersion?: string) {
    this.config = loadFramework(frameworkVersion);
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
      genAIReadiness: this.config.genAIReadinessComponents
        ? { score: 0, components: {}, assessedCriteria: 0, totalCriteria: 7 }
        : undefined,
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
        criterionConfidence: {},
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

    // Recompute per-criterion confidence for ALL scored criteria in this dimension.
    for (const criterionId of Object.keys(dim.criterionScores)) {
      dim.criterionConfidence[criterionId] = this.calculateCriterionConfidence(
        dimensionId,
        criterionId
      );
    }
    dim.score = calculateDimensionScore(dim, this.config);
    dim.confidence = this.calculateDimConfidence(dimensionId);
    this.session.aiReadiness = calculateAIReadinessScore(
      this.session.dimensions,
      this.config
    );
    if (this.config.genAIReadinessComponents) {
      this.session.genAIReadiness = calculateGenAIReadinessScore(
        this.session.dimensions,
        this.config
      );
    }
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

    const byDimension: Record<string, number | null> = {};
    let overallBenchmarkSum = 0;
    let overallBenchmarkCount = 0;
    for (const dim of this.config.dimensions) {
      const dimAssessment = dims[dim.id];
      const targets = dim.criteria.filter(
        (c) => c.benchmarkTarget !== undefined
      );
      if (targets.length === 0) {
        byDimension[dim.id] = null;
        continue;
      }
      const assessedTargets = targets.filter(
        (c) => dimAssessment?.criterionScores?.[c.id] !== undefined
      );
      if (assessedTargets.length === 0) {
        byDimension[dim.id] = null;
        continue;
      }
      const sumDelta = assessedTargets.reduce(
        (s, c) =>
          s +
          calculateBenchmarkDelta(
            dimAssessment.criterionScores[c.id],
            c.benchmarkTarget
          ),
        0
      );
      const avg = sumDelta / assessedTargets.length;
      byDimension[dim.id] = Math.round(avg * 10) / 10;
      overallBenchmarkSum += avg;
      overallBenchmarkCount++;
    }

    return {
      dimensions: dims,
      aiReadiness: this.session.aiReadiness,
      genAIReadiness: this.session.genAIReadiness,
      signalsCollected: Object.values(dims).reduce(
        (sum, d) => sum + d.evidence.length,
        0
      ),
      dimensionsAssessed: assessedCount,
      dimensionsRemaining:
        this.config.dimensions.length - assessedCount,
      nextFocus: this.getNextUnassessedDimension(),
      orgProfile: this.session.orgProfile,
      frameworkVersion: this.config.version,
      benchmark: {
        overall:
          overallBenchmarkCount > 0
            ? Math.round((overallBenchmarkSum / overallBenchmarkCount) * 10) /
              10
            : null,
        byDimension,
      },
    };
  }

  /**
   * Kick off an agent-led assessment. Returns a seed user-message + system
   * context the agent uses to produce its opening turn WITHOUT requiring the
   * user to speak first. Called by runAgentKickoff() (Task 8).
   */
  startAssessment(): {
    seedMessage: string;
    orgProfile: OrgProfile;
    frameworkVersion: string;
  } {
    return {
      seedMessage:
        '(Assessment start — respond with one short sentence: "Hi there, can you tell me more about your company to get started?")',
      orgProfile: this.session.orgProfile,
      frameworkVersion: this.config.version,
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

  private calculateCriterionConfidence(
    dimensionId: string,
    criterionId: string
  ): number {
    const dim = this.session.dimensions[dimensionId];
    if (!dim) return 0;
    const threshold = Math.max(1, Math.round(this.config.evidenceThreshold));
    const strengthUnits = dim.evidence
      .filter((e) => e.criterionId === criterionId)
      .reduce((sum, e) => sum + (e.strength ?? 0.5) * (e.weight ?? 1), 0);
    return Math.min(1, strengthUnits / threshold);
  }

  private calculateDimConfidence(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    const dimConfig = getDimensionById(this.config, dimensionId);
    if (!dim || !dimConfig) return 0;

    const scoredCount = Object.keys(dim.criterionScores).length;
    const coverageFactor =
      dimConfig.criteria.length > 0
        ? scoredCount / dimConfig.criteria.length
        : 0;

    const threshold = Math.max(1, Math.round(this.config.evidenceThreshold));
    const totalPossibleStrength = dimConfig.criteria.length * threshold;
    const actualStrength = dim.evidence.reduce(
      (sum, e) => sum + (e.strength ?? 0.5) * (e.weight ?? 1),
      0
    );
    const volumeFactor =
      totalPossibleStrength > 0
        ? Math.min(1, actualStrength / totalPossibleStrength)
        : 0;

    return coverageFactor * 0.6 + volumeFactor * 0.4;
  }

  private calculateDimScore(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    return dim ? calculateDimensionScore(dim, this.config) : 0;
  }

  private getNextUnassessedDimension(): string {
    const unassessed = this.config.dimensions.filter((dim) => {
      const assessment = this.session.dimensions[dim.id];
      return assessment && assessment.confidence < this.config.confidenceThreshold;
    });
    return unassessed.length > 0 ? unassessed[0].id : "";
  }
}
