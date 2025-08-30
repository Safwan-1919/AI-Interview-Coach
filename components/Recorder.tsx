
import React from 'react';

interface RecorderProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  transcript: string;
  disabled?: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ isListening, onStart, onStop, transcript, disabled = false }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center space-y-6 mt-4">
      <div className="relative">
        <button
          onClick={isListening ? onStop : onStart}
          disabled={disabled}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700' 
              : disabled 
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <i className={`fas fa-microphone text-4xl text-white ${isListening ? 'animate-pulse' : ''} ${disabled ? 'opacity-50' : ''}`}></i>
        </button>
        {isListening && !disabled && (
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-red-500 opacity-75 animate-ping -z-10"></div>
        )}
      </div>
      <p className="text-lg text-gray-300 font-medium">
        {disabled 
            ? "Microphone access is required." 
            : isListening 
                ? "Listening... Click to stop." 
                : "Click the mic to start answering."}
      </p>
      <div className="w-full bg-gray-900/50 p-4 rounded-lg min-h-[100px] border border-gray-700">
          <p className="text-gray-400 italic">{transcript || "Your transcribed answer will appear here..."}</p>
      </div>
    </div>
  );
};

export default Recorder;
