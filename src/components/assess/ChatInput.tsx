"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onUpload: (file: File) => void;
  onVoiceInput: () => void;
  isLoading: boolean;
  isListening: boolean;
}

export function ChatInput({
  onSend,
  onUpload,
  onVoiceInput,
  isLoading,
  isListening,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Attach document"
        >
          📎
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        <Button
          variant={isListening ? "destructive" : "ghost"}
          size="icon"
          onClick={onVoiceInput}
          title={isListening ? "Listening..." : "Voice input"}
        >
          {isListening ? "🔴" : "🎤"}
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about your organization..."
          className="min-h-[44px] max-h-[120px] resize-none bg-muted/30"
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="gradient-primary text-white"
        >
          {isLoading ? "..." : "→"}
        </Button>
      </div>
    </div>
  );
}
