// Web Speech API recognition wrapper with clean error handling and cross-browser fallbacks
export interface SpeechRecognitionListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd?: () => void;
}

export class BrowserSpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(listener: SpeechRecognitionListener) {
    if (!this.recognition) {
      listener.onError("Speech recognition is not supported in this browser. You can type your response.");
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        listener.onResult(text, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          listener.onError("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else if (event.error !== "no-speech") {
          listener.onError(`Recognition issue: ${event.error}`);
        }
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (listener.onEnd) listener.onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      console.warn("Error starting speech recognition:", err);
      listener.onError("Could not access microphone.");
      this.isListening = false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Safe silence
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
