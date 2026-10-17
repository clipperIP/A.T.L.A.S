/**
 * Voice and Speech Recognition Engine for A.T.L.A.S.
 * Wraps SpeechRecognition (WebKit) and SpeechSynthesis with robust fallbacks.
 */

// Interface for Web Speech API SpeechRecognition
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class AtlasVoiceEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onStateChangeCallback: ((listening: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onWakeWordDetectedCallback: (() => void) | null = null;
  private wakeWordActive: boolean = false;
  private wakeWordRecognition: SpeechRecognitionInstance | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      try {
        this.recognition = new SpeechRecognitionAPI();
        if (this.recognition) {
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onstart = () => {
            this.isListening = true;
            this.onStateChangeCallback?.(true);
          };

          this.recognition.onend = () => {
            this.isListening = false;
            this.onStateChangeCallback?.(false);
          };

          this.recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition error:', event.error);
            this.isListening = false;
            this.onStateChangeCallback?.(false);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              this.onErrorCallback?.(event.error);
            }
          };

          this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            if (finalTranscript) {
              this.onResultCallback?.(finalTranscript, true);
            } else if (interimTranscript) {
              this.onResultCallback?.(interimTranscript, false);
            }
          };
        }
      } catch (e) {
        console.error('Failed to initialize speech recognition:', e);
      }
    }
  }

  public isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isTTSSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onStateChange: (listening: boolean) => void,
    onError: (err: string) => void
  ) {
    if (!this.recognition) {
      onError('Speech Recognition is not supported on this browser engine.');
      return;
    }

    if (this.isListening) {
      return;
    }

    // Stop wake word listener temporarily while active listening
    this.stopWakeWordListener();

    this.onResultCallback = onResult;
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError;

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('Start listening error:', e);
      this.onErrorCallback?.(e.message || 'Microphone start failed');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }
    this.isListening = false;
    this.onStateChangeCallback?.(false);

    // Resume wake word listener if it was enabled
    if (this.wakeWordActive) {
      setTimeout(() => this.startWakeWordListener(this.onWakeWordDetectedCallback!), 500);
    }
  }

  public abortListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
    }
    this.isListening = false;
    this.onStateChangeCallback?.(false);
  }

  /**
   * Speak output text with either Studio Neural Voice (Gemini TTS) or Browser SpeechSynthesis
   */
  public async speak(
    text: string,
    options: {
      engineType?: 'neural' | 'browser';
      neuralVoice?: 'Charon' | 'Fenrir' | 'Puck';
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    this.stopSpeaking();

    const cleanedText = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanedText) {
      options.onEnd?.();
      return;
    }

    // Try Studio Neural J.A.R.V.I.S. Voice if selected (default)
    const useNeural = options.engineType !== 'browser';

    if (useNeural) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedText,
            voice: options.neuralVoice || 'Charon',
          }),
        });

        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.volume = options.volume ?? 1.0;
          this.currentAudio = audio;

          audio.onplay = () => {
            options.onStart?.();
          };

          audio.onended = () => {
            this.currentAudio = null;
            options.onEnd?.();
          };

          audio.onerror = (e) => {
            console.warn('Audio element error, falling back to browser voice:', e);
            this.currentAudio = null;
            this.speakWithBrowserTTS(cleanedText, options);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('Neural TTS request failed, falling back to browser voice:', err);
      }
    }

    // Fallback or explicit Browser Web Speech
    this.speakWithBrowserTTS(cleanedText, options);
  }

  private speakWithBrowserTTS(
    cleanedText: string,
    options: {
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) {
    if (!this.isTTSSupported()) {
      options.onError?.('Speech Synthesis not supported');
      options.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 0.92; // Slightly deeper, refined British pitch
    utterance.volume = options.volume ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (options.voiceURI) {
      const selected = voices.find((v) => v.voiceURI === options.voiceURI);
      if (selected) utterance.voice = selected;
    } else {
      // Prioritize authentic British English JARVIS tone
      const britishJarvisVoice = voices.find(
        (v) =>
          v.lang.startsWith('en-GB') ||
          v.name.includes('UK') ||
          v.name.includes('British') ||
          v.name.includes('Daniel') ||
          v.name.includes('George') ||
          v.name.includes('Oliver') ||
          v.name.includes('English (United Kingdom)')
      );
      const naturalEnVoice = voices.find(
        (v) => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en')
      );
      utterance.voice =
        britishJarvisVoice || naturalEnVoice || voices.find((v) => v.lang.startsWith('en')) || null;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      options.onError?.(e);
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    if (this.isTTSSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  public getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isTTSSupported()) {
        resolve([]);
        return;
      }

      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      const handler = () => {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(voices);
      };

      window.speechSynthesis.addEventListener('voiceschanged', handler);

      // Fallback timeout
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 500);
    });
  }

  /**
   * Foreground Client-Side Wake-Word Detector ("Hey Atlas" / "Atlas")
   * Explicitly notes: Works while browser tab is active in foreground.
   * Background screen-off listening on Samsung Galaxy requires native foreground service.
   */
  public startWakeWordListener(onDetected: () => void) {
    if (!this.isSpeechSupported()) return;

    this.wakeWordActive = true;
    this.onWakeWordDetectedCallback = onDetected;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    try {
      const rec: SpeechRecognitionInstance = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const phrase = event.results[i][0].transcript.toLowerCase();
          if (
            phrase.includes('hey jarvis') ||
            phrase.includes('jarvis') ||
            phrase.includes('hey atlas') ||
            phrase.includes('atlas')
          ) {
            // Wake word detected!
            this.stopWakeWordListener();
            onDetected();
            break;
          }
        }
      };

      rec.onend = () => {
        // Automatically restart if wake word is still active and not manually listening
        if (this.wakeWordActive && !this.isListening) {
          try {
            this.wakeWordRecognition?.start();
          } catch (_) {}
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          this.wakeWordActive = false;
        }
      };

      rec.start();
      this.wakeWordRecognition = rec;
    } catch (e) {
      console.warn('Wake word init error:', e);
    }
  }

  public stopWakeWordListener() {
    this.wakeWordActive = false;
    if (this.wakeWordRecognition) {
      try {
        this.wakeWordRecognition.stop();
        this.wakeWordRecognition = null;
      } catch (_) {}
    }
  }
}

export const voiceEngine = new AtlasVoiceEngine();
