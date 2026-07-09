"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

interface ChatPanelProps {
  onAssessmentUpdate: (delta: ReturnType<typeof useChat>["currentDelta"]) => void;
  onComplete: () => void;
}

export function ChatPanel({ onAssessmentUpdate, onComplete }: ChatPanelProps) {
  const { messages, isLoading, currentDelta, isComplete, sendMessage, uploadDocument } = useChat();
  const { isListening, startListening, speak, isSupported: voiceSupported } = useVoice();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentDelta) onAssessmentUpdate(currentDelta);
  }, [currentDelta, onAssessmentUpdate]);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  // Auto-speak assistant messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      speak(lastMsg.content);
    }
  }, [messages, speak]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleVoiceInput = async () => {
    try {
      const text = await startListening();
      if (text) sendMessage(text);
    } catch {
      // Voice recognition failed silently
    }
  };

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result?.signalsCount > 0) {
      sendMessage(
        `I've uploaded "${file.name}". I found ${result.signalsCount} relevant signals. Please review and ask follow-up questions.`
      );
    } else if (result) {
      sendMessage(
        `I've uploaded "${file.name}" but couldn't extract strong signals. Please ask me about what you found in it.`
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">Assessment Chat</h2>
        <p className="text-xs text-muted-foreground">AI Consultant is ready</p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <p className="text-lg mb-2">👋 Welcome!</p>
            <p>Tell me about your organization to begin the assessment.</p>
            <p className="mt-2 text-xs">I&apos;ll assess 7 dimensions of digital & AI maturity.</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatInput
        onSend={sendMessage}
        onUpload={handleUpload}
        onVoiceInput={handleVoiceInput}
        isLoading={isLoading}
        isListening={isListening}
      />
    </div>
  );
}
