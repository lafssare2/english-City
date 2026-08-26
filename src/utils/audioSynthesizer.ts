// Web Audio API procedural sound synthesizer & Web Speech API Speech Synthesis / Recognition

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a rewarding coin pickup sound
  public playCoin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // Play an XP / Mission success fanfare
  public playXpSuccess() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.35);
    });
  }

  public playSuccess() {
    this.playXpSuccess();
  }

  // Play Level-Up achievement chime
  public playLevelUp() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
    });
  }

  // Play dialog message bubble pop
  public playDialoguePop() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Play UI Click / Navigation tap
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // Subway / Transit chime
  public playTransitChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chord = [587.33, 739.99, 880]; // D5, F#5, A5
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    });
  }
}

export const sound = new SoundEngine();

export function setAudioMuted(muted: boolean) {
  sound.enabled = !muted;
}


// Speech Synthesis Engine (TTS)
export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    onEnd?: () => void;
  }
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const cleanText = text.replace(/[*_#`~]/g, "").trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.rate || 0.95; // slightly paced for English learners
  utterance.pitch = options?.pitch || 1.0;
  utterance.lang = "en-US";

  // Select suitable English voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    if (enVoices.length > 0) {
      if (options?.voiceName) {
        const matched = enVoices.find((v) => v.name.toLowerCase().includes(options.voiceName!.toLowerCase()));
        utterance.voice = matched || enVoices[0];
      } else {
        utterance.voice = enVoices[0];
      }
    }
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

// Speech Recognition Hook Helper
export function createSpeechRecognizer(callbacks: {
  onResult: (transcript: string) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    callbacks.onResult(transcript);
  };

  recognition.onerror = (e: any) => {
    console.warn("Speech recognition error:", e);
    if (callbacks.onError) callbacks.onError(e);
  };

  recognition.onend = () => {
    if (callbacks.onEnd) callbacks.onEnd();
  };

  return recognition;
}
