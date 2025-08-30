
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTextToSpeechProps {
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
}

export const useTextToSpeech = ({ onEnd, onError }: UseTextToSpeechProps = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Keep track of the current utterance to prevent race conditions from old, cancelled speech.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Effect for initialization and cleanup
  useEffect(() => {
    // This listener is just to encourage the browser to load voices.
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Cleanup: cancel any speech when the component unmounts.
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (window.speechSynthesis) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text.trim()) {
      onEnd?.();
      return;
    }
    
    // Stop any currently speaking utterance.
    // By nullifying the ref first, we prevent the old utterance's 'onend'/'onerror'
    // from firing and causing state conflicts.
    if (utteranceRef.current) {
        utteranceRef.current = null;
    }
    window.speechSynthesis.cancel();

    // Use a short timeout to give the speech engine a moment to reset after cancellation.
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        // Only update state if this is the currently active utterance.
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
          onEnd?.();
        }
      };

      utterance.onerror = (event) => {
        // We trigger 'canceled' or 'interrupted' errors intentionally, so don't treat them as faults.
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error(`SpeechSynthesisUtterance.onerror - Error: ${event.error}`, event);
          onError?.(event);
        }

        // Ensure state machine progresses even on error, but only for the active utterance.
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
          // Still call onEnd to ensure the app doesn't get stuck.
          onEnd?.();
        }
      };

      // Voice selection logic - get fresh voices each time.
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('en'));
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.default);
      }
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (voices.length > 0) {
        console.warn("Could not find a preferred English voice, using the first available.");
        utterance.voice = voices[0];
      } else {
         console.warn("No speech synthesis voices available at all.");
      }

      utterance.pitch = 1;
      utterance.rate = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    }, 100);

  }, [onEnd, onError]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      // Nullify the ref to prevent onend/onerror handlers from firing on a manual stop.
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isSpeaking, speak, stopSpeaking };
};
