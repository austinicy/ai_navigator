"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "SpeechRecognition" in window) {
      recognitionRef.current = new (window as unknown as { SpeechRecognition: typeof SpeechRecognition }).SpeechRecognition();
    } else if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      recognitionRef.current = new (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition();
    }
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
    isSupported: !!recognitionRef.current,
  };
}
