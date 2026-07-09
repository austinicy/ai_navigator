"use client";

import { useState, useEffect, useCallback } from "react";
import { AssessmentDelta } from "@/lib/assessment/types";

const STORAGE_KEY = "ai-navigator-assessment";

export function useAssessment() {
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDelta(parsed.delta);
        setOrgName(parsed.orgName);
        setIndustry(parsed.industry);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveAssessment = useCallback(
    (newDelta: AssessmentDelta | null, name?: string, ind?: string) => {
      setDelta(newDelta);
      if (name) setOrgName(name);
      if (ind) setIndustry(ind);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          delta: newDelta,
          orgName: name ?? orgName,
          industry: ind ?? industry,
        })
      );
    },
    [orgName, industry]
  );

  const clearAssessment = useCallback(() => {
    setDelta(null);
    setOrgName("");
    setIndustry("");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { delta, orgName, industry, saveAssessment, clearAssessment };
}
