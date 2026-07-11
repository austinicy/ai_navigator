export interface AgoraVoiceSession {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  agentId: string;
  agentUid: number;
}

export interface AgoraTranscript {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
}
