"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";
import { AssessmentDelta } from "@/lib/assessment/types";
import {
  createNewActiveSessionId,
  getOrCreateActiveSessionId,
} from "@/lib/assessment/client-session";

const STORAGE_KEY = "ai-navigator-assessment";
const HISTORY_STORAGE_KEY = "ai-navigator-assessment-history";
const MAX_HISTORY_ENTRIES = 20;
const subscribeHydration = () => () => undefined;

export interface StoredAssessment {
  sessionId: string;
  delta: AssessmentDelta | null;
  orgName: string;
  industry: string;
  createdAt: number;
  updatedAt: number;
}

export interface AssessmentHistoryEntry extends Omit<StoredAssessment, "delta"> {
  delta: AssessmentDelta;
}

function emptyAssessment(sessionId = ""): StoredAssessment {
  return {
    sessionId,
    delta: null,
    orgName: "",
    industry: "",
    createdAt: 0,
    updatedAt: 0,
  };
}

function safeWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to persist ${key}:`, error);
  }
}

function readStoredAssessment(): StoredAssessment {
  if (typeof window === "undefined") return emptyAssessment();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyAssessment(getOrCreateActiveSessionId());
    const parsed = JSON.parse(stored) as Partial<StoredAssessment>;
    return {
      sessionId: parsed.sessionId ?? getOrCreateActiveSessionId(),
      delta: parsed.delta ?? null,
      orgName: parsed.orgName ?? "",
      industry: parsed.industry ?? "",
      createdAt: parsed.createdAt ?? Date.now(),
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return emptyAssessment(getOrCreateActiveSessionId());
  }
}

function readHistory(): AssessmentHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is AssessmentHistoryEntry =>
        Boolean(
          entry &&
            typeof entry === "object" &&
            typeof (entry as AssessmentHistoryEntry).sessionId === "string" &&
            (entry as AssessmentHistoryEntry).delta
        )
    );
  } catch {
    return [];
  }
}

export function useAssessment() {
  const [assessment, setAssessment] = useState<StoredAssessment>(readStoredAssessment);
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>(readHistory);
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );
  const assessmentRef = useRef(assessment);
  const historyRef = useRef(history);

  const saveAssessment = useCallback(
    (newDelta: AssessmentDelta | null, name?: string, ind?: string) => {
      const current = assessmentRef.current;
      const now = Date.now();
      const sessionId = getOrCreateActiveSessionId();
      const next: StoredAssessment = {
        sessionId,
        delta: newDelta,
        orgName: name ?? current.orgName,
        industry: ind ?? current.industry,
        createdAt:
          current.sessionId === sessionId && current.createdAt
            ? current.createdAt
            : now,
        updatedAt: now,
      };
      assessmentRef.current = next;
      setAssessment(next);
      safeWrite(STORAGE_KEY, next);

      if (newDelta) {
        const entry: AssessmentHistoryEntry = {
          ...next,
          delta: newDelta,
        };
        const updated = [
          entry,
          ...historyRef.current.filter((item) => item.sessionId !== sessionId),
        ].slice(0, MAX_HISTORY_ENTRIES);
        historyRef.current = updated;
        setHistory(updated);
        safeWrite(HISTORY_STORAGE_KEY, updated);
      }
    },
    []
  );

  const clearAssessment = useCallback(() => {
    const next = emptyAssessment(getOrCreateActiveSessionId());
    assessmentRef.current = next;
    setAssessment(next);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const startNewAssessment = useCallback(() => {
    const sessionId = createNewActiveSessionId();
    const next = emptyAssessment(sessionId);
    assessmentRef.current = next;
    setAssessment(next);
    window.localStorage.removeItem(STORAGE_KEY);
    return sessionId;
  }, []);

  const deleteHistoryEntry = useCallback((sessionId: string) => {
    const updated = historyRef.current.filter((entry) => entry.sessionId !== sessionId);
    historyRef.current = updated;
    setHistory(updated);
    safeWrite(HISTORY_STORAGE_KEY, updated);
  }, []);

  const getHistoryEntry = useCallback(
    (sessionId: string | null) =>
      sessionId ? history.find((entry) => entry.sessionId === sessionId) ?? null : null,
    [history]
  );

  return {
    ...assessment,
    history,
    isHydrated,
    saveAssessment,
    clearAssessment,
    startNewAssessment,
    deleteHistoryEntry,
    getHistoryEntry,
  };
}
