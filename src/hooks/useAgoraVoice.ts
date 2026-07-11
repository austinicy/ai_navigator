"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type AgoraRTCType from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import type { AgoraTranscript, AgoraVoiceSession } from "@/lib/agora/types";
import { getOrCreateActiveSessionId } from "@/lib/assessment/client-session";

type Chunk = { index: number; total: number; content: string };

export function useAgoraVoice() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<AgoraTranscript[]>([]);
  const [sharedContext, setSharedContext] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const sessionRef = useRef<AgoraVoiceSession | null>(null);
  const chunksRef = useRef(new Map<string, Chunk[]>());
  const startInFlightRef = useRef(false);
  const operationRef = useRef(0);
  const remoteAudioEnabledRef = useRef(true);

  const handlePayload = useCallback((payload: Uint8Array) => {
    try {
      const raw = new TextDecoder().decode(payload);
      const [id, indexText, totalText, ...contentParts] = raw.split("|");
      const index = Number(indexText);
      const total = Number(totalText);
      if (!id || !Number.isFinite(index) || !Number.isFinite(total)) return;
      const chunks = chunksRef.current.get(id) ?? [];
      if (!chunks.some((chunk) => chunk.index === index)) {
        chunks.push({ index, total, content: contentParts.join("|") });
      }
      chunksRef.current.set(id, chunks);
      if (chunks.length !== total) return;

      const encoded = chunks.sort((a, b) => a.index - b.index).map((c) => c.content).join("");
      chunksRef.current.delete(id);
      const message = JSON.parse(atob(encoded)) as {
        object?: string;
        text?: string;
        turn_id?: number;
        final?: boolean;
        turn_status?: number;
      };
      if (!message.text || !message.object?.includes("transcription")) return;
      const role = message.object.startsWith("assistant") ? "assistant" : "user";
      const transcriptId = `${role}-${message.turn_id ?? id}`;
      const final = role === "user" ? message.final !== false : message.turn_status !== 0;
      setTranscripts((current) => {
        const next = current.filter((item) => item.id !== transcriptId);
        return [...next, { id: transcriptId, role, text: message.text!, final }];
      });
    } catch {
      // Agora may also send non-transcription data messages.
    }
  }, []);

  const stop = useCallback(async () => {
    operationRef.current += 1;
    const session = sessionRef.current;
    const mic = micRef.current;
    const client = clientRef.current;
    sessionRef.current = null;
    micRef.current = null;
    clientRef.current = null;
    mic?.close();
    if (client) {
      await client.leave().catch(() => undefined);
      client.removeAllListeners();
    }
    if (session) {
      await fetch("/api/agora/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: session.agentId }),
      }).catch(() => undefined);
    }
    setSharedContext(false);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (startInFlightRef.current || clientRef.current) return;
    startInFlightRef.current = true;
    const operation = ++operationRef.current;
    setStatus("connecting");
    setError(null);
    setTranscripts([]);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }
      let permissionStream: MediaStream;
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (cause) {
        const name = cause instanceof DOMException ? cause.name : "";
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          throw new Error(
            "No microphone was found. Connect or enable a microphone, then try again."
          );
        }
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          throw new Error(
            "Microphone permission was denied. Allow microphone access in your browser settings, then try again."
          );
        }
        throw new Error("The microphone could not be opened. Check your audio device and try again.");
      }
      permissionStream.getTracks().forEach((track) => track.stop());
      if (operation !== operationRef.current) return;

      const response = await fetch("/api/agora/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getOrCreateActiveSessionId() }),
      });
      const data = (await response.json()) as AgoraVoiceSession & { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to create Agora session");
      sessionRef.current = data;
      setSharedContext(data.sharedContext);
      if (operation !== operationRef.current) {
        await stop();
        return;
      }

      const agoraModule = (await import("agora-rtc-sdk-ng")) as unknown as {
        default: typeof AgoraRTCType;
      };
      const AgoraRTC = agoraModule.default;
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
          user.audioTrack?.setVolume(remoteAudioEnabledRef.current ? 100 : 0);
        }
      });
      client.on("stream-message", (_uid, payload) => handlePayload(payload));
      client.on("connection-state-change", (current) => {
        if (current === "DISCONNECTED") setStatus("error");
      });

      await client.join(data.appId, data.channel, data.token, data.uid);
      if (operation !== operationRef.current) {
        await stop();
        return;
      }
      const mic = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
        AGC: true,
      });
      micRef.current = mic;
      await client.publish(mic);
      if (operation !== operationRef.current) {
        await stop();
        return;
      }
      setIsMuted(false);
      setStatus("connected");
    } catch (cause) {
      if (operation !== operationRef.current) return;
      const message = cause instanceof Error ? cause.message : "Agora voice failed";
      setError(message);
      await stop();
      setStatus("error");
    } finally {
      startInFlightRef.current = false;
    }
  }, [handlePayload, stop]);

  const toggleMute = useCallback(async () => {
    const next = !isMuted;
    await micRef.current?.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  const setMuted = useCallback(async (muted: boolean) => {
    const mic = micRef.current;
    if (!mic) return;
    await mic.setMuted(muted);
    setIsMuted(muted);
  }, []);

  const setRemoteAudioEnabled = useCallback((enabled: boolean) => {
    remoteAudioEnabledRef.current = enabled;
    for (const user of clientRef.current?.remoteUsers ?? []) {
      user.audioTrack?.setVolume(enabled ? 100 : 0);
    }
  }, []);

  useEffect(() => () => void stop(), [stop]);

  return {
    status,
    error,
    isMuted,
    transcripts,
    start,
    stop,
    toggleMute,
    setMuted,
    setRemoteAudioEnabled,
    sharedContext,
  };
}
