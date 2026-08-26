import { speakText, createSpeechRecognizer } from "../utils/audioSynthesizer";

export const speechService = {
  speak: (
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onEnd?: () => void;
    }
  ) => {
    speakText(text, options);
  },
  createRecognizer: (callbacks: {
    onResult: (transcript: string) => void;
    onError?: (err: any) => void;
    onEnd?: () => void;
  }) => {
    return createSpeechRecognizer(callbacks);
  },
};
