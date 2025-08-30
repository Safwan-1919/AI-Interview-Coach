import { useState, useEffect, useRef, useCallback } from 'react';

// Minimal type definitions for the Web Speech API to satisfy TypeScript
// and provide type safety within the hook.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
}

// This is the constructor type
type SpeechRecognitionConstructor = new () => SpeechRecognition;

const SpeechRecognition: SpeechRecognitionConstructor | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Add a ref to track if the user intentionally stopped the recording.
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      // Append the finalized transcript part, ensuring proper spacing.
      if (finalTranscript) {
        setTranscript(prev => (prev.trim() ? prev.trim() + ' ' : '') + finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is a common event on mobile when there's a pause. We don't want to
      // treat it as a fatal error, as our auto-restart logic will handle it.
      if (event.error === 'no-speech') {
        console.warn('Speech recognition stopped due to no speech.');
        return;
      }
      setError(event.error);
      console.error('Speech recognition error', event.error);
    };

    // This is the key change to handle mobile browser behavior.
    recognition.onend = () => {
      // If recognition ends but it wasn't a manual stop, restart it.
      // This creates a continuous listening experience until the user explicitly stops it.
      if (!isStoppingRef.current) {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch(e) {
                console.error("Could not restart speech recognition", e);
                setIsListening(false);
            }
        }
      } else {
        // This was a manual stop, so we ensure the state is correctly set to not listening.
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      // Reset the stopping flag before starting.
      isStoppingRef.current = false;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      // Set the flag to indicate a manual stop.
      isStoppingRef.current = true;
      recognitionRef.current.stop();
      // Set listening to false immediately for a responsive UI.
      // The `onend` handler will see the ref and not restart.
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
      setTranscript('');
  }, []);

  return { isListening, transcript, startListening, stopListening, error, resetTranscript };
};
