"use client";

import { useSyncExternalStore } from "react";

function subscribeToBrowserSupport() {
  return () => undefined;
}

export function getSpeechRecognitionConstructor(): typeof SpeechRecognition | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
  );
}

export function useSpeechRecognitionSupport() {
  return useSyncExternalStore(
    subscribeToBrowserSupport,
    () => Boolean(getSpeechRecognitionConstructor()),
    () => false
  );
}
