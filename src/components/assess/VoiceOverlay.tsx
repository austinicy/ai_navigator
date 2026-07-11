// src/components/assess/VoiceOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Keyboard, LoaderCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { useAgoraVoice } from "@/hooks/useAgoraVoice";
import type { ChatMessage as ChatMessageType } from "@/lib/assessment/types";
import type { AgoraTranscript } from "@/lib/agora/types";

interface VoiceOverlayProps {
  active: boolean;
  onExit: () => void;
  messages: ChatMessageType[];
  syncVoiceTranscript: (content: string) => Promise<void>;
  appendVoiceAssistant: (content: string) => Promise<void>;
  refreshAssessment: () => Promise<void>;
  onFinalTranscript: (transcript: AgoraTranscript) => void;
  isLoading: boolean;
}

export function VoiceOverlay({
  active,
  onExit,
  messages,
  syncVoiceTranscript,
  appendVoiceAssistant,
  refreshAssessment,
  onFinalTranscript,
  isLoading,
}: VoiceOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncedTranscriptsRef = useRef(new Set<string>());
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const previousStatusRef = useRef<string>("idle");
  const {
    status,
    error,
    isMuted,
    transcripts,
    start,
    toggleMute,
    setMuted,
    setRemoteAudioEnabled,
    sharedContext,
  } = useAgoraVoice();

  // Keep the Agora agent mounted across mode changes. Text mode mutes both the
  // microphone and remote playback; returning to voice resumes the same RTC
  // channel, agent, and transcript history instead of creating a new session.
  useEffect(() => {
    let cancelled = false;

    const applyMode = async () => {
      setRemoteAudioEnabled(active);

      if (active) {
        if (status === "idle" || status === "error") {
          await start();
          if (cancelled) await setMuted(true);
        } else if (status === "connected" && isMuted) {
          await setMuted(false);
        }
      } else if (status === "connected" && !isMuted) {
        await setMuted(true);
      }
    };

    void applyMode();
    return () => {
      cancelled = true;
    };
  }, [active, isMuted, setMuted, setRemoteAudioEnabled, start, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, transcripts]);

  // In shared-context mode, Agora's custom LLM endpoint has already persisted
  // both sides of the turn and updated scoring; refresh after the finalized
  // assistant transcript. The direct-provider localhost fallback persists the
  // user through the assessment loop and appends Agora's actual reply.
  useEffect(() => {
    if (status === "connecting" && previousStatusRef.current !== "connecting") {
      syncedTranscriptsRef.current.clear();
    }
    previousStatusRef.current = status;

    for (const transcript of transcripts) {
      if (!transcript.final || !transcript.text.trim() || syncedTranscriptsRef.current.has(transcript.id)) {
        continue;
      }

      syncedTranscriptsRef.current.add(transcript.id);
      const finalized = { ...transcript, text: transcript.text.trim() };
      onFinalTranscript(finalized);

      if (sharedContext) {
        if (transcript.role === "assistant") {
          syncQueueRef.current = syncQueueRef.current
            .then(refreshAssessment)
            .catch((cause) => console.error("Shared scorecard refresh failed:", cause));
        }
      } else {
        const persist =
          transcript.role === "user"
            ? () => syncVoiceTranscript(finalized.text)
            : () => appendVoiceAssistant(finalized.text);
        syncQueueRef.current = syncQueueRef.current
          .then(persist)
          .catch((cause) => console.error("Voice context sync failed:", cause));
      }
    }
  }, [
    appendVoiceAssistant,
    onFinalTranscript,
    refreshAssessment,
    sharedContext,
    status,
    syncVoiceTranscript,
    transcripts,
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Voice Mode</h2>
          <p className="text-xs text-muted-foreground">
            {status === "connecting"
              ? "Connecting to Agora…"
              : status === "connected"
                ? isMuted
                  ? "Microphone muted"
                  : "Agora is listening — just talk"
                : status === "error"
                  ? "Voice connection failed"
                  : "Voice session ended"}
          </p>
        </div>
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-border"
        >
          <Keyboard className="size-3.5" /> Text input
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {transcripts.map((transcript) => (
          <div
            key={transcript.id}
            className={`flex mb-4 ${transcript.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[85%] bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm">
              <p className={!transcript.final ? "text-muted-foreground italic" : undefined}>
                {transcript.text}{!transcript.final && "…"}
              </p>
            </div>
          </div>
        ))}
        {error && (
          <div className="mx-auto max-w-md rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-border p-6 flex flex-col items-center gap-3">
        <button
          onClick={() => {
            if (status === "error" || status === "idle") void start();
            else void toggleMute();
          }}
          disabled={status === "connecting"}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            status === "connected" && !isMuted
              ? "bg-red-500/20 border-2 border-red-500"
              : "gradient-primary text-white border-2 border-transparent"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {status === "connecting" ? (
            <LoaderCircle className="size-8 animate-spin" />
          ) : isMuted ? (
            <MicOff className="size-8" />
          ) : (
            <Mic className="size-8" />
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          {isLoading
            ? "Updating live scorecard…"
            : status === "connected"
              ? isMuted
                ? "Tap to unmute"
                : "Tap to mute"
              : "Tap to reconnect"}
        </p>
      </div>
    </div>
  );
}
