import React, { useState } from 'react';
import { Analysis } from '../types';
import ScoreCircle from './ScoreCircle';

interface AnalysisCardProps {
  analysis: Analysis;
  userAnswer: string;
  onNextQuestion: () => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, userAnswer, onNextQuestion }) => {
  const [activeTab, setActiveTab] = useState<'professional' | 'fresher'>('professional');

  return (
    <div className="w-full flex flex-col space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-teal-300">Analysis Complete</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Score + User Answer */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Satisfaction Score</h3>
            <ScoreCircle score={analysis.score} />
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Your Answer</h3>
            <blockquote className="text-gray-300 italic border-l-4 border-gray-600 pl-4 py-2 bg-gray-800/30 rounded-r-md max-h-48 overflow-y-auto">
              "{userAnswer}"
            </blockquote>
          </div>
        </div>

        {/* Right Column: Detailed Feedback */}
        <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6">
          <h3 className="text-xl font-bold text-white">Detailed Feedback</h3>
          
          <div>
              <h4 className="flex items-center text-lg font-semibold text-green-400 mb-2">
                  <i className="fas fa-check-circle mr-2"></i>Strengths
              </h4>
              <p className="text-white bg-gray-800/40 p-3 rounded-md whitespace-pre-wrap">{analysis.strengths}</p>
          </div>

          <div>
              <h4 className="flex items-center text-lg font-semibold text-yellow-400 mb-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>Areas for Improvement
              </h4>
              <ul className="list-none space-y-3">
                  {analysis.areasForImprovement.map((item, index) => (
                      <li key={index} className="bg-gray-800/50 p-3 rounded-md border-l-4 border-yellow-500">
                          <p className="font-bold text-white">{item.category}</p>
                          <p className="text-gray-300 whitespace-pre-wrap">{item.feedback}</p>
                      </li>
                  ))}
              </ul>
          </div>
            
          <div>
            <details className="group bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden" open>
              <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold text-blue-400 hover:bg-gray-800/60 transition-colors p-4">
                <div className="flex items-center">
                    <i className="fas fa-lightbulb mr-2"></i>
                    <span>View Suggested Answer</span>
                </div>
                <i className="fas fa-chevron-down transform group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="border-t border-gray-700 bg-gray-900/50">
                <div className="border-b border-gray-700">
                  <div className="flex">
                      <button 
                        onClick={() => setActiveTab('professional')}
                        className={`flex-1 p-3 font-medium text-sm transition-colors ${activeTab === 'professional' ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
                      >
                        For Professionals
                      </button>
                      <button 
                        onClick={() => setActiveTab('fresher')}
                        className={`flex-1 p-3 font-medium text-sm transition-colors ${activeTab === 'fresher' ? 'bg-blue-600/30 text-blue-300 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
                      >
                        For Freshers
                      </button>
                  </div>
                </div>
                <div className="p-4">
                  <blockquote className="text-white whitespace-pre-wrap font-light">
                    {activeTab === 'professional' ? analysis.suggestedAnswerProfessional : analysis.suggestedAnswerFresher}
                  </blockquote>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={onNextQuestion}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          Ask Next Question
        </button>
      </div>
    </div>
  );
};

export default AnalysisCard;