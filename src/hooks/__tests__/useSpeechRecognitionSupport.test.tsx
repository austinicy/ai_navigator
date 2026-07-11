// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useSpeechRecognitionSupport } from "../useSpeechRecognitionSupport";

function SupportState() {
  const isSupported = useSpeechRecognitionSupport();
  return <span>{isSupported ? "supported" : "unsupported"}</span>;
}

describe("useSpeechRecognitionSupport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses an unsupported server snapshot even when the browser API exists", () => {
    vi.stubGlobal("SpeechRecognition", vi.fn());

    expect(renderToString(<SupportState />)).toContain("unsupported");
    expect(renderHook(() => useSpeechRecognitionSupport()).result.current).toBe(true);
  });
});
