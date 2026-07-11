import { describe, expect, it } from "vitest";
import { AssessmentEngine } from "../engine";
import { getAssessmentSessionRepository, SessionConflictError } from "../session-repository";

describe("durable assessment session snapshots", () => {
  it("restores conversation and scoring state from a JSON snapshot", () => {
    const original = new AssessmentEngine({ name: "Acme", industry: "Retail" });
    original.addConversationMessage("user", "We use copilots in customer support.");
    original.updateDimensionScore("strategy", { digital_vision: 3 }, ["Need a funded roadmap"]);

    const restored = AssessmentEngine.fromSnapshot(JSON.parse(JSON.stringify(original.toSnapshot())));

    expect(restored.getSession().orgProfile.name).toBe("Acme");
    expect(restored.getSession().conversationHistory).toHaveLength(1);
    expect(restored.getSession().dimensions.strategy.criterionScores.digital_vision).toBe(3);
  });

  it("detects a stale write in the local development repository", async () => {
    delete process.env.GCS_SESSION_BUCKET;
    const repository = getAssessmentSessionRepository();
    const sessionId = `session-${Date.now()}-repository-test`;
    const first = await repository.save(sessionId, new AssessmentEngine().toSnapshot());

    await expect(repository.save(sessionId, new AssessmentEngine().toSnapshot(), "0"))
      .rejects.toBeInstanceOf(SessionConflictError);
    expect(first.version).toBe("1");
  });

  it("lists locally persisted sessions by their latest update", async () => {
    delete process.env.GCS_SESSION_BUCKET;
    const repository = getAssessmentSessionRepository();
    const olderId = `session-${Date.now()}-older-list`;
    const newerId = `session-${Date.now()}-newer-list`;
    const older = new AssessmentEngine({ name: "Older" });
    older.getSession().updatedAt = 1;
    const newer = new AssessmentEngine({ name: "Newer" });
    newer.getSession().updatedAt = 2;
    await repository.save(olderId, older.toSnapshot());
    await repository.save(newerId, newer.toSnapshot());

    const sessions = await repository.list();
    expect(sessions.findIndex((session) => session.sessionId === newerId))
      .toBeLessThan(sessions.findIndex((session) => session.sessionId === olderId));
  });
});
