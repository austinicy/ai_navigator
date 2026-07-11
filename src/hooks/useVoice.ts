"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSpeechRecognitionConstructor,
  useSpeechRecognitionSupport,
} from "@/hooks/useSpeechRecognitionSupport";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = useSpeechRecognitionSupport();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (Ctor) recognitionRef.current = new Ctor();
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
    }
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognitionRef.current) {
        reject(new Error("Speech recognition not supported"));
        return;
      }
      setIsListening(true);
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        resolve(text);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        reject(new Error("Speech recognition error"));
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current.start();
    });
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    speak,
    stopSpeaking,
    isSupported,
  };
}
