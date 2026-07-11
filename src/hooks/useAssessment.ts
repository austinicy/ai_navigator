"use client";

import { useState, useCallback } from "react";
import { AssessmentDelta } from "@/lib/assessment/types";

const STORAGE_KEY = "ai-navigator-assessment";

interface StoredAssessment {
  delta: AssessmentDelta | null;
  orgName: string;
  industry: string;
}

const emptyAssessment: StoredAssessment = {
  delta: null,
  orgName: "",
  industry: "",
};

function readStoredAssessment(): StoredAssessment {
  if (typeof window === "undefined") return emptyAssessment;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyAssessment;
    const parsed = JSON.parse(stored) as Partial<StoredAssessment>;
    return {
      delta: parsed.delta ?? null,
      orgName: parsed.orgName ?? "",
      industry: parsed.industry ?? "",
    };
  } catch {
    return emptyAssessment;
  }
}

export function useAssessment() {
  const [assessment, setAssessment] = useState<StoredAssessment>(readStoredAssessment);

  const saveAssessment = useCallback(
    (newDelta: AssessmentDelta | null, name?: string, ind?: string) => {
      setAssessment((current) => {
        const next = {
          delta: newDelta,
          orgName: name ?? current.orgName,
          industry: ind ?? current.industry,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearAssessment = useCallback(() => {
    setAssessment(emptyAssessment);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { ...assessment, saveAssessment, clearAssessment };
}
