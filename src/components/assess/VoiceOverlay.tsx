// src/components/assess/VoiceOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import { Mic, Circle, Keyboard } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { useContinuousVoice } from "@/hooks/useContinuousVoice";
import type { ChatMessage as ChatMessageType } from "@/lib/assessment/types";

interface VoiceOverlayProps {
  onExit: () => void;
  messages: ChatMessageType[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export function VoiceOverlay({ onExit, messages, sendMessage, isLoading }: VoiceOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, isSpeaking, interimTranscript, start, stop, speak, isSupported } =
    useContinuousVoice({
      onTranscript: (text) => {
        if (!isLoading) void sendMessage(text);
      },
    });

  // Start listening on mount; stop on unmount.
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak each new assistant message aloud (TTS), then resume listening.
  const lastSpokenRef = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.id !== lastSpokenRef.current) {
      lastSpokenRef.current = last.id;
      speak(last.content);
    }
  }, [messages, speak]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interimTranscript]);

  if (!isSupported) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Voice input isn&apos;t supported in this browser. Use the text input instead.
        </p>
        <button
          onClick={onExit}
          className="gradient-primary text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Switch to text input
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Voice Mode</h2>
          <p className="text-xs text-muted-foreground">
            {isSpeaking ? "Speaking…" : isListening ? "Listening — just talk" : "Tap the mic to resume"}
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
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        {interimTranscript && (
          <div className="flex justify-end mb-4">
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground italic">
              {interimTranscript}…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-6 flex flex-col items-center gap-3">
        <button
          onClick={isListening ? stop : start}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? "bg-red-500/20 border-2 border-red-500 animate-pulse"
              : "gradient-primary text-white border-2 border-transparent"
          }`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? (
            <Circle className="size-8 text-red-500" />
          ) : (
            <Mic className="size-8" />
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          {isListening ? "Listening — speak naturally" : "Mic off"}
        </p>
      </div>
    </div>
  );
}
