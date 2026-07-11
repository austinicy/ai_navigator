// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAssessment } from "../useAssessment";
import { getDemoDelta } from "@/lib/demo/demo-delta";

describe("useAssessment history", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        get length() {
          return values.size;
        },
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => Array.from(values.keys())[index] ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, String(value)),
      } satisfies Storage,
    });
    window.localStorage.clear();
  });

  it("upserts the active result and preserves it when a new session starts", () => {
    const { result } = renderHook(() => useAssessment());
    const firstDelta = getDemoDelta();

    act(() => {
      result.current.saveAssessment(firstDelta, "First Corp", "Retail");
    });

    const firstSessionId = result.current.sessionId;
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].sessionId).toBe(firstSessionId);

    act(() => {
      result.current.saveAssessment(firstDelta, "First Corp updated", "Retail");
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].orgName).toBe("First Corp updated");

    act(() => {
      result.current.startNewAssessment();
      result.current.saveAssessment(firstDelta, "Second Corp", "Finance");
    });

    expect(result.current.sessionId).not.toBe(firstSessionId);
    expect(result.current.history).toHaveLength(2);
    expect(result.current.getHistoryEntry(firstSessionId)?.orgName).toBe(
      "First Corp updated"
    );
  });

  it("deletes a saved result without clearing the active assessment", () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.saveAssessment(getDemoDelta(), "Acme", "Manufacturing");
    });
    const sessionId = result.current.sessionId;

    act(() => {
      result.current.deleteHistoryEntry(sessionId);
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.delta).not.toBeNull();
  });
});
