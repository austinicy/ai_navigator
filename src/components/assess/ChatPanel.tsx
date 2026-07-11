"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { VoiceOverlay } from "./VoiceOverlay";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

interface ChatPanelProps {
  onAssessmentUpdate: (delta: ReturnType<typeof useChat>["currentDelta"]) => void;
  onComplete: () => void;
  autoStart?: boolean;
}

export function ChatPanel({ onAssessmentUpdate, onComplete, autoStart = true }: ChatPanelProps) {
  const { messages, isLoading, currentDelta, isComplete, sendMessage, uploadDocument, startAssessment } = useChat();
  const { isSupported: voiceSupported } = useVoice();
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kickedOffRef = useRef(false);

  // Agent-led kickoff: fire once on mount so the agent greets + asks first.
  useEffect(() => {
    if (!autoStart) return;
    if (kickedOffRef.current) return;
    kickedOffRef.current = true;
    startAssessment();
  }, [autoStart, startAssessment]);

  useEffect(() => {
    if (currentDelta) onAssessmentUpdate(currentDelta);
  }, [currentDelta, onAssessmentUpdate]);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result?.signalsCount > 0) {
      sendMessage(`I've uploaded "${file.name}". I found ${result.signalsCount} relevant signals. Please review and ask follow-up questions.`);
    } else if (result) {
      sendMessage(`I've uploaded "${file.name}" but couldn't extract strong signals. Please ask me about what you found in it.`);
    }
  };

  if (voiceMode) {
    return (
      <VoiceOverlay
        messages={messages}
        sendMessage={sendMessage}
        isLoading={isLoading}
        onExit={() => setVoiceMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Assessment Chat</h2>
          <p className="text-xs text-muted-foreground">AI Consultant is leading the assessment</p>
        </div>
        {voiceSupported && (
          <button
            onClick={() => setVoiceMode(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1 rounded border border-border"
            title="Switch to voice mode"
          >
            <Mic className="size-4" /> Voice mode
          </button>
        )}
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
      </div>
      <ChatInput
        onSend={sendMessage}
        onUpload={handleUpload}
        onVoiceInput={() => setVoiceMode(true)}
        isLoading={isLoading}
      />
    </div>
  );
}
