import { Storage } from "@google-cloud/storage";
import { AssessmentEngine } from "./engine";
import type { AssessmentSession } from "./types";

export interface StoredAssessmentSession {
  sessionId: string;
  session: AssessmentSession;
  version: string;
}

export class SessionConflictError extends Error {
  constructor() {
    super("Assessment session changed before it could be saved");
    this.name = "SessionConflictError";
  }
}

export interface AssessmentSessionRepository {
  get(sessionId: string): Promise<StoredAssessmentSession | null>;
  list(limit?: number): Promise<StoredAssessmentSession[]>;
  save(sessionId: string, session: AssessmentSession, version?: string): Promise<StoredAssessmentSession>;
}

function sessionObjectName(sessionId: string): string {
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(sessionId)) {
    throw new Error("Invalid assessment session ID");
  }
  return `sessions/${sessionId}.json`;
}

class MemoryAssessmentSessionRepository implements AssessmentSessionRepository {
  private readonly sessions = new Map<string, StoredAssessmentSession>();

  async get(sessionId: string): Promise<StoredAssessmentSession | null> {
    const stored = this.sessions.get(sessionId);
    return stored ? structuredClone(stored) : null;
  }

  async list(limit = 50): Promise<StoredAssessmentSession[]> {
    return [...this.sessions.values()]
      .sort((a, b) => b.session.updatedAt - a.session.updatedAt)
      .slice(0, limit)
      .map((stored) => structuredClone(stored));
  }

  async save(sessionId: string, session: AssessmentSession, version?: string): Promise<StoredAssessmentSession> {
    const current = this.sessions.get(sessionId);
    if (version !== undefined && current?.version !== version) throw new SessionConflictError();
    if (version === undefined && current) throw new SessionConflictError();

    const stored = {
      sessionId,
      session: structuredClone(session),
      version: String((Number(current?.version ?? "0") || 0) + 1),
    };
    this.sessions.set(sessionId, stored);
    return structuredClone(stored);
  }
}

class GcsAssessmentSessionRepository implements AssessmentSessionRepository {
  private readonly storage = new Storage();

  constructor(private readonly bucketName: string) {}

  async get(sessionId: string): Promise<StoredAssessmentSession | null> {
    const file = this.storage.bucket(this.bucketName).file(sessionObjectName(sessionId));
    const [exists] = await file.exists();
    if (!exists) return null;
    const [[contents], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
    const session = JSON.parse(contents.toString("utf8")) as AssessmentSession;
    const version = String(metadata.generation ?? "");
    if (!version) throw new Error("Stored assessment is missing an object generation");
    return { sessionId, session, version };
  }

  async list(limit = 50): Promise<StoredAssessmentSession[]> {
    const [files] = await this.storage.bucket(this.bucketName).getFiles({ prefix: "sessions/" });
    const sessionFiles = files
      .map((file) => ({ file, match: file.name.match(/^sessions\/([A-Za-z0-9_-]{8,200})\.json$/) }))
      .filter((item): item is { file: (typeof files)[number]; match: RegExpMatchArray } => Boolean(item.match))
      .slice(0, limit);

    const sessions = await Promise.all(
      sessionFiles.map(async ({ file, match }) => {
        const [[contents], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
        return {
          sessionId: match[1],
          session: JSON.parse(contents.toString("utf8")) as AssessmentSession,
          version: String(metadata.generation ?? ""),
        };
      })
    );
    return sessions.sort((a, b) => b.session.updatedAt - a.session.updatedAt);
  }

  async save(sessionId: string, session: AssessmentSession, version?: string): Promise<StoredAssessmentSession> {
    const file = this.storage.bucket(this.bucketName).file(sessionObjectName(sessionId));
    try {
      await file.save(JSON.stringify(session), {
        contentType: "application/json",
        resumable: false,
        preconditionOpts: { ifGenerationMatch: version === undefined ? 0 : Number(version) },
      });
      const [metadata] = await file.getMetadata();
      return { sessionId, session, version: String(metadata.generation) };
    } catch (error) {
      const statusCode = (error as { code?: number }).code;
      if (statusCode === 412) throw new SessionConflictError();
      throw error;
    }
  }
}

const globalRepositories = globalThis as typeof globalThis & {
  aiNavigatorMemorySessionRepository?: MemoryAssessmentSessionRepository;
};

export function getAssessmentSessionRepository(): AssessmentSessionRepository {
  const bucket = process.env.GCS_SESSION_BUCKET?.trim();
  if (bucket) return new GcsAssessmentSessionRepository(bucket);
  globalRepositories.aiNavigatorMemorySessionRepository ??= new MemoryAssessmentSessionRepository();
  return globalRepositories.aiNavigatorMemorySessionRepository;
}

export async function loadOrCreateAssessmentEngine(sessionId: string): Promise<{
  engine: AssessmentEngine;
  version?: string;
}> {
  const stored = await getAssessmentSessionRepository().get(sessionId);
  return stored
    ? { engine: AssessmentEngine.fromSnapshot(stored.session), version: stored.version }
    : { engine: new AssessmentEngine(), version: undefined };
}

export async function saveAssessmentEngine(
  sessionId: string,
  engine: AssessmentEngine,
  version?: string
): Promise<string> {
  const stored = await getAssessmentSessionRepository().save(sessionId, engine.toSnapshot(), version);
  return stored.version;
}
