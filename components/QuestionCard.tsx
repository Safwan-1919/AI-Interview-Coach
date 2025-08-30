
import React from 'react';

interface QuestionCardProps {
  question: string;
  isSpeaking: boolean;
  onSkip: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, isSpeaking, onSkip }) => {
  return (
    <div className="w-full mb-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-400">Question:</h2>
        {isSpeaking && (
          <div className="flex items-center gap-2 text-teal-400">
            <i className="fas fa-volume-high animate-pulse"></i>
            <span>Speaking...</span>
          </div>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-medium text-white min-h-[100px] flex items-center justify-center">
        "{question}"
      </p>
      <button 
        onClick={onSkip} 
        disabled={isSpeaking}
        className="text-gray-400 hover:text-white transition-colors duration-200 mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        Skip Question <i className="fas fa-forward ml-1"></i>
      </button>
    </div>
  );
};

export default QuestionCard;
