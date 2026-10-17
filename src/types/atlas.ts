export type AtlasState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export type AtlasPersona = 'tactical' | 'jarvis' | 'military' | 'cyberpunk';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  source?: string;
  audioDuration?: number;
}

export type VoiceEngineType = 'neural' | 'browser';
export type NeuralVoiceName = 'Charon' | 'Fenrir' | 'Puck';

export interface VoiceSettings {
  engineType: VoiceEngineType;
  neuralVoice: NeuralVoiceName;
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
  autoSpeak: boolean;
  soundEffects: boolean;
  continuousConversation: boolean;
}

export interface PersonaConfig {
  id: AtlasPersona;
  name: string;
  tagline: string;
  directive: string;
}

export interface SystemStatus {
  online: boolean;
  aiEngine: string;
  hasApiKey: boolean;
  micMuted: boolean;
  wakeWordActive: boolean;
  activeDevice: string;
}
