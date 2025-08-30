
import React, { useState, useEffect, useCallback } from 'react';
import { InterviewState, Analysis } from './types';
// FIX: Import `analyzeAnswer` to make it available in the component.
import { generateInterviewQuestion, analyzeAnswer } from './services/geminiService';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import QuestionCard from './components/QuestionCard';
import Recorder from './components/Recorder';
import AnalysisCard from './components/AnalysisCard';
import Loader from './components/Loader';

const basicQuestions = {
  "Behavioural": [
    "Tell me about yourself.",
    "Run me through your resume.",
    "What are your strengths?",
    "Give me an example of your creativity.",
    "What has been your most significant achievement?",
    "What have you done that shows initiative?",
    "What are your outside interests?",
    "How has your education prepared you for this career?",
    "Are you overqualified for this position?",
    "Are you planning for higher studies?",
    "What was the last goal you set for yourself and how did you achieve it?",
    "Who has inspired you in your life and why?",
    "Why did you choose your college?",
    "Why did you choose your degree?",
    "If you didn't pursue this degree, what would be the alternative?",
    "What was the toughest decision you ever had to make?",
    "What were your long-term and short-term goals?",
    "What motivates you to do a good job?",
    "What makes you angry?"
  ],
  "Company Specific": [
    "Why should we hire you?",
    "Why do you want this job?",
    "What do you know about this company?",
    "Are you ready to work under pressure?",
    "Are you willing to relocate?",
    "Are you ready to sign a contract or bond?",
    "What are your salary expectations?",
    "Are you willing to work in night shifts?",
    "If we hire you, how long would you like to stay with our company?",
    "What is your greatest weakness?",
    "How do you implement the STAR methodology (Situation, Task, Action, Result) in your responses?",
    "Do you have any questions for me?"
  ]
};

const allBasicQuestions = [...basicQuestions.Behavioural, ...basicQuestions["Company Specific"]];


const App: React.FC = () => {
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [resumeText, setResumeText] = useState<string>('');
  const [interviewMode, setInterviewMode] = useState<'random' | 'basic'>('random');
  const [basicQuestionIndex, setBasicQuestionIndex] = useState<number>(0);
  const [isPdfLibReady, setIsPdfLibReady] = useState<boolean>(false);
  
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech({
      onEnd: () => setInterviewState(InterviewState.LISTENING),
      onError: () => {
        setError("Sorry, I had trouble speaking the question. Please read it and record your answer.");
      },
  });

  const { isListening, transcript, startListening, stopListening, resetTranscript, error: recognitionError } = useSpeechRecognition();

  useEffect(() => {
    // Poll to see if the PDF.js library has loaded from the CDN.
    const interval = setInterval(() => {
      if ((window as any).pdfjsLib) {
        setIsPdfLibReady(true);
        clearInterval(interval);
      }
    }, 100);

    // Set a timeout to stop checking after a while, in case the CDN fails.
    const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!(window as any).pdfjsLib) {
            console.error("PDF.js library failed to load after 10 seconds.");
            setError("The PDF reader library failed to load. You can still paste your resume text.");
        }
    }, 10000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, []);

  const handleStartInterview = useCallback(async () => {
    setError(null);
    setMicPermissionError(false);
    setAnalysis(null);
    setUserAnswer('');
    resetTranscript();

    if (interviewMode === 'basic') {
      const nextQuestion = allBasicQuestions[basicQuestionIndex % allBasicQuestions.length];
      setBasicQuestionIndex(prev => prev + 1);
      setCurrentQuestion(nextQuestion);
      setInterviewState(InterviewState.ASKING_QUESTION);
    } else { // 'random' mode
      setInterviewState(InterviewState.GENERATING_QUESTION);
      try {
        const question = await generateInterviewQuestion({
          askedQuestions: askedQuestions,
          resumeText: resumeText
        });
        setAskedQuestions(prev => [...prev, question]);
        setCurrentQuestion(question);
        setInterviewState(InterviewState.ASKING_QUESTION);
      } catch (err) {
        setError('Failed to generate a question. Please check your API key and try again.');
        setInterviewState(InterviewState.IDLE);
      }
    }
  }, [askedQuestions, resetTranscript, resumeText, interviewMode, basicQuestionIndex]);

  useEffect(() => {
    if (interviewState === InterviewState.ASKING_QUESTION && currentQuestion) {
      speak(currentQuestion);
    }
  }, [interviewState, currentQuestion, speak]);
  
  useEffect(() => {
    if (recognitionError) {
      if (recognitionError === 'not-allowed') {
        setError("Microphone access was denied. You'll need to enable it in your browser settings to record your answer.");
        setMicPermissionError(true);
      } else {
        setError(`Speech Recognition Error: ${recognitionError}. Please try again.`);
      }
      setInterviewState(InterviewState.LISTENING);
    }
  }, [recognitionError]);

  const handleStopRecording = useCallback(async () => {
    stopListening();
    if (!transcript.trim()) {
        setError("I didn't catch that. Could you please try answering again?");
        setInterviewState(InterviewState.LISTENING);
        return;
    }
    setUserAnswer(transcript);
    setInterviewState(InterviewState.ANALYZING);
    setError(null);
    try {
      const result = await analyzeAnswer(currentQuestion, transcript, resumeText);
      setAnalysis(result);
      setInterviewState(InterviewState.SHOWING_ANALYSIS);
    } catch (err) {
      setError('Failed to analyze your answer. Please try again.');
      setInterviewState(InterviewState.LISTENING);
    }
  }, [stopListening, transcript, currentQuestion, resumeText]);
  
  const handleSkipQuestion = () => {
    stopSpeaking();
    handleStartInterview();
  };
  
  const handleResumeTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(event.target.value);
  };

  const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (!(window as any).pdfjsLib) {
              // This is a fallback, as the input should be disabled until the lib is ready.
              setError("PDF processing library is not ready. Please wait a moment and try again.");
              return;
          }
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const pdfjsLib = (window as any).pdfjsLib;
                  // The worker is needed for parallel processing and better performance
                  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

                  const typedarray = new Uint8Array(e.target!.result as ArrayBuffer);
                  const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                  let fullText = '';
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const textContent = await page.getTextContent();
      
                      const pageText = textContent.items.map((item: any) => item.str).join(' ');
                      fullText += pageText + '\n';
                  }
                  setResumeText(fullText);
                  setError(null); 
              } catch (err) {
                  setError("Failed to parse the PDF file. Please ensure it's a valid, text-based PDF.");
                  console.error("PDF Parsing Error:", err);
              }
          };
          reader.onerror = () => {
              setError("Failed to read the resume file.");
          };
          reader.readAsArrayBuffer(file);
      }
  };

  const handleGoHome = () => {
    stopSpeaking();
    stopListening();
    setInterviewState(InterviewState.IDLE);
    setCurrentQuestion('');
    setUserAnswer('');
    setAnalysis(null);
    setError(null);
    setAskedQuestions([]);
    setBasicQuestionIndex(0);
    resetTranscript();
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        <header className="w-full text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            AI Interview Coach
          </h1>
          <p className="text-gray-400 mt-2">Practice your interview skills with an AI-powered coach.</p>
        </header>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <main className="w-full bg-gray-800/50 rounded-lg p-6 md:p-8 shadow-2xl border border-gray-700 min-h-[400px] flex flex-col items-center justify-center">
          {interviewState === InterviewState.IDLE && (
            <div className="w-full flex flex-col items-center animate-fade-in space-y-6">
              <div className="w-full">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Interview Mode</h3>
                <div className="flex bg-gray-900/60 p-1 rounded-lg border border-gray-700">
                  <button onClick={() => setInterviewMode('random')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${interviewMode === 'random' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    Random Questions
                  </button>
                  <button onClick={() => setInterviewMode('basic')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${interviewMode === 'basic' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    Basic Questions
                  </button>
                </div>
              </div>
              <div className="w-full">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Provide Your Resume (Optional)</h3>
                <p className="text-sm text-gray-500 mb-3">For personalized, resume-based questions, upload or paste your resume content.</p>
                <textarea
                  value={resumeText}
                  onChange={handleResumeTextChange}
                  placeholder="Paste your resume text here..."
                  className="w-full h-32 p-3 bg-gray-900/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                />
                <div className="text-center my-2 text-gray-500">OR</div>
                <div className="relative">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf"
                    onChange={handleResumeFileChange}
                    disabled={!isPdfLibReady}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <label 
                    htmlFor="resume-upload" 
                    className={`block w-full text-center py-3 px-4 rounded-lg border-2 border-dashed transition-colors ${!isPdfLibReady ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed' : 'bg-gray-800 border-gray-600 hover:border-blue-500 hover:bg-gray-700 text-gray-300 cursor-pointer'}`}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    {!isPdfLibReady ? 'Initializing PDF reader...' : 'Upload a .pdf file'}
                  </label>
                </div>
              </div>
              <button
                onClick={handleStartInterview}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              >
                Start Interview
              </button>
            </div>
          )}

          {interviewState === InterviewState.GENERATING_QUESTION && <Loader message="Generating question..." />}
          {interviewState === InterviewState.ANALYZING && <Loader message="Analyzing your answer..." />}

          {(interviewState === InterviewState.ASKING_QUESTION || interviewState === InterviewState.LISTENING) && (
            <div className="w-full animate-fade-in">
              <QuestionCard 
                question={currentQuestion}
                isSpeaking={isSpeaking}
                onSkip={handleSkipQuestion}
              />
              <Recorder 
                isListening={isListening}
                onStart={startListening}
                onStop={handleStopRecording}
                transcript={transcript}
                disabled={isSpeaking || micPermissionError}
              />
            </div>
          )}

          {interviewState === InterviewState.SHOWING_ANALYSIS && analysis && (
            <AnalysisCard 
              analysis={analysis} 
              userAnswer={userAnswer}
              onNextQuestion={handleStartInterview}
            />
          )}
        </main>

        {interviewState !== InterviewState.IDLE && (
          <button 
            onClick={handleGoHome}
            className="mt-6 text-gray-400 hover:text-white transition-colors duration-200 text-sm">
            <i className="fas fa-home mr-1"></i>
            End Interview & Go Home
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
