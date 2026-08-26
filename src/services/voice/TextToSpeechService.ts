import { BrowserSpeechRecognitionService } from "./SpeechRecognitionService";

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  gender?: "female" | "male";
  accent?: string;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface ITextToSpeechProvider {
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: () => boolean;
}

// 1. Browser Web Speech Synthesis Implementation
export class BrowserTextToSpeechService implements ITextToSpeechProvider {
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    try {
      this.voices = window.speechSynthesis.getVoices();
    } catch (e) {
      this.voices = [];
    }
  }

  public speak(text: string, options?: SpeakOptions) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;
      utterance.lang = "en-US";

      if (this.voices.length > 0) {
        // Match preferred voice
        let selectedVoice = this.voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (options?.gender === "female"
              ? v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("victoria") ||
                v.name.toLowerCase().includes("karen") ||
                v.name.toLowerCase().includes("zira")
              : v.name.toLowerCase().includes("male") ||
                v.name.toLowerCase().includes("daniel") ||
                v.name.toLowerCase().includes("david") ||
                v.name.toLowerCase().includes("george"))
        );

        if (!selectedVoice) {
          selectedVoice = this.voices.find((v) => v.lang.startsWith("en"));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        if (options?.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        console.warn("TTS playback issue:", e);
        if (options?.onEnd) options.onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS Error:", err);
      if (options?.onEnd) options.onEnd();
    }
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  public isSpeaking(): boolean {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }
}

// 2. Cloud Neural Voice Provider (Interface prepared for high-fidelity audio streams)
export class CloudNeuralVoiceProvider implements ITextToSpeechProvider {
  public speak(text: string, options?: SpeakOptions) {
    // Fallback to browser voice if cloud endpoint is not connected
    const fallback = new BrowserTextToSpeechService();
    fallback.speak(text, options);
  }

  public stop() {
    const fallback = new BrowserTextToSpeechService();
    fallback.stop();
  }

  public isSpeaking(): boolean {
    return false;
  }
}

// 3. Unified Voice Manager Singleton
export const voiceRecognitionService = new BrowserSpeechRecognitionService();
export const voiceTTSService = new BrowserTextToSpeechService();
