// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the Web Speech API on the global object.
class MockRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  maxAlternatives = 1;
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [i: number]: { transcript: string } } } }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

describe("useContinuousVoice", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reports unsupported when SpeechRecognition is absent", async () => {
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const { result } = renderHook(() => useContinuousVoice({ onTranscript: vi.fn() }));
    expect(result.current.isSupported).toBe(false);
  });

  it("starts continuous recognition and fires onTranscript on final results", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(function () { return recognition; }));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useContinuousVoice({ onTranscript }));
    act(() => result.current.start());
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.start).toHaveBeenCalled();
    // Simulate a final result.
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: "hello world" } } },
      });
    });
    expect(onTranscript).toHaveBeenCalledWith("hello world");
    vi.unstubAllGlobals();
  });

  it("updates interimTranscript for non-final results without firing onTranscript", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(function () { return recognition; }));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useContinuousVoice({ onTranscript }));
    act(() => result.current.start());
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: false, 0: { transcript: "hel" } } },
      });
    });
    expect(onTranscript).not.toHaveBeenCalled();
    expect(result.current.interimTranscript).toBe("hel");
    vi.unstubAllGlobals();
  });

  it("re-arms recognition after onend (continuous mode)", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(function () { return recognition; }));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const { result } = renderHook(() => useContinuousVoice({ onTranscript: vi.fn() }));
    act(() => result.current.start());
    recognition.start.mockClear();
    act(() => recognition.onend?.());
    // The hook should call start() again to keep listening.
    expect(recognition.start).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("resumes listening after speech synthesis errors when the mic was active", async () => {
    const recognition = new MockRecognition();
    let utterance: {
      onerror: (() => void) | null;
    } | null = null;
    const captureUtterance = (value: { onerror: (() => void) | null }) => {
      utterance = value;
    };

    class MockUtterance {
      onerror: (() => void) | null = null;

      constructor(text: string) {
        void text;
        captureUtterance(this);
      }
    }

    vi.stubGlobal("SpeechRecognition", vi.fn(function () { return recognition; }));
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: vi.fn(), cancel: vi.fn() },
      configurable: true,
    });

    const { useContinuousVoice } = await import("../useContinuousVoice");
    const { result } = renderHook(() => useContinuousVoice({ onTranscript: vi.fn() }));

    act(() => result.current.start());
    recognition.start.mockClear();

    const speaking = result.current.speak("hello");
    act(() => utterance?.onerror?.());
    await speaking;

    expect(recognition.stop).toHaveBeenCalled();
    expect(recognition.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
    vi.unstubAllGlobals();
  });
});
