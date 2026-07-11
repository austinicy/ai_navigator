"use client";

import { useState, useCallback, useRef } from "react";
import { AgentResponse, AssessmentDelta, ChatMessage } from "@/lib/assessment/types";
import { getOrCreateActiveSessionId } from "@/lib/assessment/client-session";

interface UploadResponse {
  filename: string;
  signalsCount: number;
  assessment: AssessmentDelta;
  documentCount: number;
  error?: string;
  warning?: string;
}

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  initialDelta?: AssessmentDelta | null;
  initialComplete?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => options.initialMessages ?? []);
  const [voiceMessages, setVoiceMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDelta, setCurrentDelta] = useState<AssessmentDelta | null>(
    () => options.initialDelta ?? null
  );
  const [isComplete, setIsComplete] = useState(() => options.initialComplete ?? false);
  const voiceSyncQueueRef = useRef<Promise<void>>(Promise.resolve());

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId: getOrCreateActiveSessionId(),
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data: AgentResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        assessment: data.assessment,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentDelta(data.assessment);
      setIsComplete(data.isComplete);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncVoiceTranscript = useCallback((content: string) => {
    const sync = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            sessionId: getOrCreateActiveSessionId(),
            mode: "assessment_sync",
          }),
        });

        if (!response.ok) throw new Error("Voice assessment sync failed");

        const data: AgentResponse = await response.json();
        setCurrentDelta(data.assessment);
        setIsComplete(data.isComplete);
      } catch (error) {
        console.error("Voice assessment sync error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    // Finalized transcripts can arrive close together. Keep assessment turns
    // ordered so the in-memory session cannot be updated concurrently.
    const queued = voiceSyncQueueRef.current.then(sync, sync);
    voiceSyncQueueRef.current = queued.catch(() => undefined);
    return queued;
  }, []);

  const appendVoiceAssistant = useCallback(async (content: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        sessionId: getOrCreateActiveSessionId(),
        mode: "append_voice_assistant",
      }),
    });
    if (!response.ok) throw new Error("Unable to persist voice assistant context");
  }, []);

  const refreshAssessment = useCallback(async () => {
    const params = new URLSearchParams({ sessionId: getOrCreateActiveSessionId() });
    const response = await fetch(`/api/chat?${params.toString()}`);
    if (!response.ok) throw new Error("Unable to refresh shared assessment context");
    const data: AgentResponse = await response.json();
    setCurrentDelta(data.assessment);
    setIsComplete(data.isComplete);
  }, []);

  const recordVoiceTranscript = useCallback(
    (transcript: { id: string; role: "user" | "assistant"; text: string }) => {
      setVoiceMessages((current) => {
        const id = `voice-${transcript.id}`;
        if (current.some((message) => message.id === id)) return current;
        return [
          ...current,
          {
            id,
            role: transcript.role,
            content: transcript.text,
            timestamp: Date.now(),
          },
        ];
      });
    },
    []
  );

  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", getOrCreateActiveSessionId());
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            id: `upload-error-${Date.now()}`,
            role: "assistant",
            content: `I couldn't process that document: ${data.error || "Upload failed"}`,
            timestamp: Date.now(),
          },
        ]);
        return null;
      }
      setCurrentDelta(data.assessment);
      if (data.warning) {
        setMessages((current) => [
          ...current,
          {
            id: `upload-warning-${Date.now()}`,
            role: "assistant",
            content: data.warning!,
            timestamp: Date.now(),
          },
        ]);
      }
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Upload failed";
      setMessages((current) => [
        ...current,
        {
          id: `upload-error-${Date.now()}`,
          role: "assistant",
          content: `I couldn't process that document: ${message}`,
          timestamp: Date.now(),
        },
      ]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kickoff: true,
          sessionId: getOrCreateActiveSessionId(),
        }),
      });
      if (!response.ok) throw new Error("Kickoff failed");
      const data: AgentResponse = await response.json();
      const openingMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        assessment: data.assessment,
      };
      setMessages((prev) => [...prev, openingMessage]);
      setCurrentDelta(data.assessment);
      setIsComplete(data.isComplete);
    } catch (error) {
      console.error("Kickoff error:", error);
      // Fallback greeting so the UI isn't empty if the API is unreachable.
      const fallback: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Hi there, can you tell me more about your company to get started?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
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
  };
}
