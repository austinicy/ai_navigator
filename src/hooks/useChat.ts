"use client";

import { useState, useCallback } from "react";
import { AgentResponse, AssessmentDelta, ChatMessage } from "@/lib/assessment/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDelta, setCurrentDelta] = useState<AssessmentDelta | null>(null);
  const [isComplete, setIsComplete] = useState(false);

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
        body: JSON.stringify({ message: content, sessionId: "current" }),
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

  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload error:", error);
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
        body: JSON.stringify({ kickoff: true, sessionId: "current" }),
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
        content: "Hello! I'm your AI Transformation Navigator. Let's start with Strategy & Leadership — who sponsors digital and AI transformation in your organization?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    currentDelta,
    isComplete,
    sendMessage,
    uploadDocument,
    startAssessment,
  };
}
