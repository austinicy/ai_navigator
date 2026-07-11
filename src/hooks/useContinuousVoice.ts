"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSpeechRecognitionConstructor,
  useSpeechRecognitionSupport,
} from "@/hooks/useSpeechRecognitionSupport";

interface UseContinuousVoiceOptions {
  onTranscript: (text: string) => void;
  onAssistantSpeaking?: () => boolean;
}

export function useContinuousVoice({ onTranscript, onAssistantSpeaking }: UseContinuousVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const isSupported = useSpeechRecognitionSupport();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const speakingCheckRef = useRef(onAssistantSpeaking);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    speakingCheckRef.current = onAssistantSpeaking;
  }, [onAssistantSpeaking]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) onTranscriptRef.current(text);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are benign in continuous mode; keep going.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Re-arm if we're still supposed to be listening and the assistant isn't talking.
      if (shouldListenRef.current && !speakingCheckRef.current?.()) {
        try {
          recognition.start();
        } catch {
          // start() throws if already started; ignore.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = true;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    setInterimTranscript("");
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      // Pause listening while speaking so the mic doesn't capture TTS.
      const wasListening = shouldListenRef.current;
      if (wasListening) {
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after the assistant finishes speaking.
        if (wasListening) {
          shouldListenRef.current = true;
          setIsListening(true);
          try {
            recognitionRef.current?.start();
          } catch {
            /* ignore */
          }
        }
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (wasListening) {
          shouldListenRef.current = true;
          setIsListening(true);
          try {
            recognitionRef.current?.start();
          } catch {
            /* ignore */
          }
        }
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isListening, isSpeaking, interimTranscript, start, stop, speak, stopSpeaking, isSupported };
}
