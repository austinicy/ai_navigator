"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Plus } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { VoiceOverlay } from "./VoiceOverlay";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { AssessmentDelta, ChatMessage as AssessmentChatMessage } from "@/lib/assessment/types";

interface ChatPanelProps {
  onAssessmentUpdate: (delta: ReturnType<typeof useChat>["currentDelta"]) => void;
  onComplete: () => void;
  autoStart?: boolean;
  onNewAssessment?: () => void;
  initialMessages?: AssessmentChatMessage[];
  initialAssessment?: AssessmentDelta | null;
  initialComplete?: boolean;
}

export function ChatPanel({
  onAssessmentUpdate,
  onComplete,
  autoStart = true,
  onNewAssessment,
  initialMessages,
  initialAssessment,
  initialComplete,
}: ChatPanelProps) {
  const {
    messages,
    voiceMessages,
    isLoading,
    currentDelta,
    isComplete,
    sendMessage,
    syncVoiceTranscript,
    appendVoiceAssistant,
    refreshAssessment,
    recordVoiceTranscript,
    uploadDocument,
    startAssessment,
  } = useChat({ initialMessages, initialDelta: initialAssessment, initialComplete });
  const { isSupported: voiceSupported } = useVoice();
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kickedOffRef = useRef(false);
  const textTranscript = useMemo(
    () => [...messages, ...voiceMessages].sort((a, b) => a.timestamp - b.timestamp),
    [messages, voiceMessages]
  );

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
  }, [textTranscript]);

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result?.warning) return;
    if (result && result.signalsCount > 0) {
      sendMessage(`I've uploaded "${file.name}". I found ${result.signalsCount} relevant signals. Please review and ask follow-up questions.`);
    } else if (result) {
      sendMessage(`I've uploaded "${file.name}" but couldn't extract strong signals. Please ask me about what you found in it.`);
    }
  };

  return (
    <div className="h-full">
      <div className={voiceMode ? "h-full" : "hidden"} aria-hidden={!voiceMode}>
        <VoiceOverlay
          active={voiceMode}
          messages={messages}
          syncVoiceTranscript={syncVoiceTranscript}
          appendVoiceAssistant={appendVoiceAssistant}
          refreshAssessment={refreshAssessment}
          onFinalTranscript={recordVoiceTranscript}
          isLoading={isLoading}
          onExit={() => setVoiceMode(false)}
        />
      </div>
      <div
        className={voiceMode ? "hidden" : "flex h-full flex-col"}
        aria-hidden={voiceMode}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Assessment Chat</h2>
            <p className="text-xs text-muted-foreground">AI Consultant is leading the assessment</p>
          </div>
          <div className="flex items-center gap-2">
            {onNewAssessment && (
              <button
                onClick={onNewAssessment}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1 rounded border border-border"
                title="Save this session and start a new assessment"
              >
                <Plus className="size-4" /> New
              </button>
            )}
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
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {textTranscript.map((msg) => (
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
    </div>
  );
}
