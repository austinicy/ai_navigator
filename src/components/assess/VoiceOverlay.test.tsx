// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoiceOverlay } from "./VoiceOverlay";

const voice = vi.hoisted(() => ({
  status: "idle" as "idle" | "connecting" | "connected" | "error",
  isMuted: false,
  sharedContext: false,
  transcripts: [] as Array<{
    id: string;
    role: "user" | "assistant";
    text: string;
    final: boolean;
  }>,
  start: vi.fn(async () => undefined),
  stop: vi.fn(async () => undefined),
  toggleMute: vi.fn(async () => undefined),
  setMuted: vi.fn(async () => undefined),
  setRemoteAudioEnabled: vi.fn(),
}));

vi.mock("@/hooks/useAgoraVoice", () => ({
  useAgoraVoice: () => ({
    status: voice.status,
    error: null,
    isMuted: voice.isMuted,
    transcripts: voice.transcripts,
    start: voice.start,
    stop: voice.stop,
    toggleMute: voice.toggleMute,
    setMuted: voice.setMuted,
    setRemoteAudioEnabled: voice.setRemoteAudioEnabled,
    sharedContext: voice.sharedContext,
  }),
}));

describe("VoiceOverlay mode lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voice.status = "idle";
    voice.isMuted = false;
    voice.sharedContext = false;
    voice.transcripts = [];
    Element.prototype.scrollTo = vi.fn();
  });

  it("does not start Agora until voice mode becomes active", async () => {
    const props = {
      onExit: vi.fn(),
      messages: [],
      syncVoiceTranscript: vi.fn(async () => undefined),
      appendVoiceAssistant: vi.fn(async () => undefined),
      refreshAssessment: vi.fn(async () => undefined),
      onFinalTranscript: vi.fn(),
      isLoading: false,
    };
    const { rerender } = render(<VoiceOverlay {...props} active={false} />);

    expect(voice.start).not.toHaveBeenCalled();
    expect(voice.setRemoteAudioEnabled).toHaveBeenCalledWith(false);

    rerender(<VoiceOverlay {...props} active />);
    await waitFor(() => expect(voice.start).toHaveBeenCalledTimes(1));
  });

  it("mutes a connected session in text mode and resumes it without restarting", async () => {
    voice.status = "connected";
    voice.isMuted = false;
    const props = {
      onExit: vi.fn(),
      messages: [],
      syncVoiceTranscript: vi.fn(async () => undefined),
      appendVoiceAssistant: vi.fn(async () => undefined),
      refreshAssessment: vi.fn(async () => undefined),
      onFinalTranscript: vi.fn(),
      isLoading: false,
    };
    const { rerender } = render(<VoiceOverlay {...props} active={false} />);

    await waitFor(() => expect(voice.setMuted).toHaveBeenCalledWith(true));
    expect(voice.setRemoteAudioEnabled).toHaveBeenCalledWith(false);
    expect(voice.stop).not.toHaveBeenCalled();

    voice.isMuted = true;
    rerender(<VoiceOverlay {...props} active />);

    await waitFor(() => expect(voice.setMuted).toHaveBeenCalledWith(false));
    expect(voice.setRemoteAudioEnabled).toHaveBeenLastCalledWith(true);
    expect(voice.start).not.toHaveBeenCalled();
    expect(voice.stop).not.toHaveBeenCalled();
  });

  it("persists both sides of a direct-provider voice turn", async () => {
    voice.status = "connected";
    voice.transcripts = [
      { id: "user-1", role: "user", text: "We use a governed RAG platform.", final: true },
      { id: "assistant-1", role: "assistant", text: "How do you evaluate it?", final: true },
    ];
    const syncVoiceTranscript = vi.fn(async () => undefined);
    const appendVoiceAssistant = vi.fn(async () => undefined);
    const onFinalTranscript = vi.fn();

    render(
      <VoiceOverlay
        active
        onExit={vi.fn()}
        messages={[]}
        syncVoiceTranscript={syncVoiceTranscript}
        appendVoiceAssistant={appendVoiceAssistant}
        refreshAssessment={vi.fn(async () => undefined)}
        onFinalTranscript={onFinalTranscript}
        isLoading={false}
      />
    );

    await waitFor(() => expect(appendVoiceAssistant).toHaveBeenCalledTimes(1));
    expect(syncVoiceTranscript).toHaveBeenCalledWith("We use a governed RAG platform.");
    expect(appendVoiceAssistant).toHaveBeenCalledWith("How do you evaluate it?");
    expect(onFinalTranscript).toHaveBeenCalledTimes(2);
  });

  it("refreshes shared scoring without duplicating the custom LLM turn", async () => {
    voice.status = "connected";
    voice.sharedContext = true;
    voice.transcripts = [
      { id: "user-1", role: "user", text: "The board reviews AI risk.", final: true },
      { id: "assistant-1", role: "assistant", text: "How often does it review?", final: true },
    ];
    const syncVoiceTranscript = vi.fn(async () => undefined);
    const appendVoiceAssistant = vi.fn(async () => undefined);
    const refreshAssessment = vi.fn(async () => undefined);

    render(
      <VoiceOverlay
        active
        onExit={vi.fn()}
        messages={[]}
        syncVoiceTranscript={syncVoiceTranscript}
        appendVoiceAssistant={appendVoiceAssistant}
        refreshAssessment={refreshAssessment}
        onFinalTranscript={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => expect(refreshAssessment).toHaveBeenCalledTimes(1));
    expect(syncVoiceTranscript).not.toHaveBeenCalled();
    expect(appendVoiceAssistant).not.toHaveBeenCalled();
  });
});
