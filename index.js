
// hooks/useTextToSpeech.ts
import { useState, useEffect, useCallback, useRef } from "react";
var useTextToSpeech = ({ onEnd, onError } = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);
  useEffect(() => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      if (window.speechSynthesis) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text.trim()) {
      onEnd?.();
      return;
    }
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
          onEnd?.();
        }
      };
      utterance.onerror = (event) => {
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.error(`SpeechSynthesisUtterance.onerror - Error: ${event.error}`, event);
          onError?.(event);
        }
        if (utteranceRef.current === utterance) {
          setIsSpeaking(false);
          utteranceRef.current = null;
          onEnd?.();
        }
      };
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find((voice) => voice.name.includes("Google") && voice.lang.startsWith("en"));
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang.startsWith("en") && voice.default);
      }
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang.startsWith("en"));
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
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);
  return { isSpeaking, speak, stopSpeaking };
};

// hooks/useSpeechRecognition.ts
import { useState as useState2, useEffect as useEffect2, useRef as useRef2, useCallback as useCallback2 } from "react";
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState2(false);
  const [transcript, setTranscript] = useState2("");
  const [error, setError] = useState2(null);
  const recognitionRef = useRef2(null);
  useEffect2(() => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript((prev) => prev + finalTranscript);
    };
    recognition.onerror = (event) => {
      setError(event.error);
      console.error("Speech recognition error", event.error);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
  }, []);
  const startListening = useCallback2(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);
  const stopListening = useCallback2(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);
  const resetTranscript = useCallback2(() => {
    setTranscript("");
  }, []);
  return { isListening, transcript, startListening, stopListening, error, resetTranscript };
};

// components/QuestionCard.tsx
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var QuestionCard = ({ question, isSpeaking, onSkip }) => {
  return /* @__PURE__ */ jsxs("div", {
    className: "w-full mb-6 text-center",
    children: [
      /* @__PURE__ */ jsxs("div", {
        className: "flex items-center justify-center gap-3 mb-4",
        children: [
          /* @__PURE__ */ jsx("h2", {
            className: "text-xl font-semibold text-gray-400",
            children: "Question:"
          }),
          isSpeaking && /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-2 text-teal-400",
            children: [
              /* @__PURE__ */ jsx("i", {
                className: "fas fa-volume-high animate-pulse"
              }),
              /* @__PURE__ */ jsx("span", {
                children: "Speaking..."
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsxs("p", {
        className: "text-2xl md:text-3xl font-medium text-white min-h-[100px] flex items-center justify-center",
        children: [
          '"',
          question,
          '"'
        ]
      }),
      /* @__PURE__ */ jsxs("button", {
        onClick: onSkip,
        disabled: isSpeaking,
        className: "text-gray-400 hover:text-white transition-colors duration-200 mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed",
        children: [
          "Skip Question ",
          /* @__PURE__ */ jsx("i", {
            className: "fas fa-forward ml-1"
          })
        ]
      })
    ]
  });
};
var QuestionCard_default = QuestionCard;

// components/Recorder.tsx
import React2 from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var Recorder = ({ isListening, onStart, onStop, onSubmit, onRetry, transcript, disabled = false }) => {
  const hasRecorded = !isListening && transcript.trim().length > 0;
  return /* @__PURE__ */ jsxs2("div", {
    className: "w-full flex flex-col items-center justify-center space-y-6 mt-4",
    children: [
      /* @__PURE__ */ jsx2("div", {
        className: "h-24 flex items-center justify-center",
        children: hasRecorded ? /* @__PURE__ */ jsxs2("div", {
          className: "flex items-center space-x-4 animate-fade-in",
          children: [
            /* @__PURE__ */ jsxs2("button", {
              onClick: onRetry,
              "aria-label": "Retry recording",
              className: "bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-full text-md transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center",
              children: [
                /* @__PURE__ */ jsx2("i", {
                  className: "fas fa-redo mr-2"
                }),
                "Retry Recording"
              ]
            }),
            /* @__PURE__ */ jsxs2("button", {
              onClick: onSubmit,
              "aria-label": "Submit for analysis",
              className: "bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-md transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center",
              children: [
                /* @__PURE__ */ jsx2("i", {
                  className: "fas fa-check mr-2"
                }),
                "Submit for Analysis"
              ]
            })
          ]
        }) : /* @__PURE__ */ jsxs2("div", {
          className: "relative",
          children: [
            /* @__PURE__ */ jsx2("button", {
              onClick: isListening ? onStop : onStart,
              disabled,
              "aria-label": isListening ? "Stop recording" : "Start recording",
              className: `w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${isListening ? "bg-red-600 hover:bg-red-700" : disabled ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`,
              children: /* @__PURE__ */ jsx2("i", {
                className: `fas fa-microphone text-4xl text-white ${isListening ? "animate-pulse" : ""} ${disabled ? "opacity-50" : ""}`
              })
            }),
            isListening && !disabled && /* @__PURE__ */ jsx2("div", {
              className: "absolute top-0 left-0 w-24 h-24 rounded-full bg-red-500 opacity-75 animate-ping -z-10"
            })
          ]
        })
      }),
      /* @__PURE__ */ jsx2("p", {
        className: "text-lg text-gray-300 font-medium h-6",
        children: disabled ? "Microphone access is required." : hasRecorded ? "Review your answer or retry." : isListening ? "Listening... Click to stop." : "Click the mic to start answering."
      }),
      /* @__PURE__ */ jsx2("div", {
        className: "w-full bg-gray-900/50 p-4 rounded-lg min-h-[100px] border border-gray-700",
        children: /* @__PURE__ */ jsx2("p", {
          className: "text-gray-400 italic",
          children: transcript || "Your transcribed answer will appear here..."
        })
      })
    ]
  });
};
var Recorder_default = Recorder;

// components/ScoreCircle.tsx
import React3, { useEffect as useEffect3, useState as useState3 } from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var ScoreCircle = ({ score }) => {
  const [displayScore, setDisplayScore] = useState3(0);
  useEffect3(() => {
    const animationDuration = 1e3;
    const frameDuration = 1e3 / 60;
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentScore = Math.round(score * progress);
      setDisplayScore(currentScore);
      if (frame === totalFrames) {
        clearInterval(counter);
        setDisplayScore(score);
      }
    }, frameDuration);
    return () => clearInterval(counter);
  }, [score]);
  const getScoreColor = (s) => {
    if (s < 50)
      return "text-red-400";
    if (s < 75)
      return "text-yellow-400";
    return "text-green-400";
  };
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - displayScore / 100 * circumference;
  const colorClass = getScoreColor(score);
  const strokeColor = colorClass.replace("text-", "stroke-");
  return /* @__PURE__ */ jsxs3("div", {
    className: "relative flex items-center justify-center",
    style: { width: size, height: size },
    children: [
      /* @__PURE__ */ jsxs3("svg", {
        className: "transform -rotate-90",
        width: size,
        height: size,
        children: [
          /* @__PURE__ */ jsx3("circle", {
            className: "stroke-gray-700",
            strokeWidth,
            fill: "transparent",
            r: radius,
            cx: size / 2,
            cy: size / 2
          }),
          /* @__PURE__ */ jsx3("circle", {
            className: `${strokeColor} transition-all duration-1000 ease-out`,
            strokeWidth,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            strokeLinecap: "round",
            fill: "transparent",
            r: radius,
            cx: size / 2,
            cy: size / 2
          })
        ]
      }),
      /* @__PURE__ */ jsx3("span", {
        className: `absolute text-3xl font-bold ${colorClass}`,
        children: displayScore
      })
    ]
  });
};
var ScoreCircle_default = ScoreCircle;

// components/AnalysisCard.tsx
import React4, { useState as useState4 } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var AnalysisCard = ({ analysis, userAnswer, onNextQuestion }) => {
  const [activeTab, setActiveTab] = useState4("professional");
  return /* @__PURE__ */ jsxs4("div", {
    className: "w-full flex flex-col space-y-6 animate-fade-in",
    children: [
      /* @__PURE__ */ jsx4("h2", {
        className: "text-2xl font-bold text-center text-teal-300",
        children: "Analysis Complete"
      }),
      /* @__PURE__ */ jsxs4("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
        children: [
          /* @__PURE__ */ jsxs4("div", {
            className: "lg:col-span-1 flex flex-col gap-6",
            children: [
              /* @__PURE__ */ jsxs4("div", {
                className: "bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col items-center justify-center",
                children: [
                  /* @__PURE__ */ jsx4("h3", {
                    className: "text-lg font-semibold text-gray-400 mb-4",
                    children: "Satisfaction Score"
                  }),
                  /* @__PURE__ */ jsx4(ScoreCircle_default, {
                    score: analysis.score
                  })
                ]
              }),
              /* @__PURE__ */ jsxs4("div", {
                className: "bg-gray-900/50 p-6 rounded-lg border border-gray-700",
                children: [
                  /* @__PURE__ */ jsx4("h3", {
                    className: "text-lg font-semibold text-gray-400 mb-2",
                    children: "Your Answer"
                  }),
                  /* @__PURE__ */ jsxs4("blockquote", {
                    className: "text-gray-300 italic border-l-4 border-gray-600 pl-4 py-2 bg-gray-800/30 rounded-r-md max-h-48 overflow-y-auto",
                    children: [
                      '"',
                      userAnswer,
                      '"'
                    ]
                  })
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsxs4("div", {
            className: "lg:col-span-2 bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6",
            children: [
              /* @__PURE__ */ jsx4("h3", {
                className: "text-xl font-bold text-white",
                children: "Detailed Feedback"
              }),
              /* @__PURE__ */ jsxs4("div", {
                children: [
                  /* @__PURE__ */ jsxs4("h4", {
                    className: "flex items-center text-lg font-semibold text-green-400 mb-2",
                    children: [
                      /* @__PURE__ */ jsx4("i", {
                        className: "fas fa-check-circle mr-2"
                      }),
                      "Strengths"
                    ]
                  }),
                  /* @__PURE__ */ jsx4("p", {
                    className: "text-white bg-gray-800/40 p-3 rounded-md whitespace-pre-wrap",
                    children: analysis.strengths
                  })
                ]
              }),
              /* @__PURE__ */ jsxs4("div", {
                children: [
                  /* @__PURE__ */ jsxs4("h4", {
                    className: "flex items-center text-lg font-semibold text-yellow-400 mb-2",
                    children: [
                      /* @__PURE__ */ jsx4("i", {
                        className: "fas fa-exclamation-triangle mr-2"
                      }),
                      "Areas for Improvement"
                    ]
                  }),
                  /* @__PURE__ */ jsx4("ul", {
                    className: "list-none space-y-3",
                    children: analysis.areasForImprovement.map((item, index) => /* @__PURE__ */ jsxs4("li", {
                      className: "bg-gray-800/50 p-3 rounded-md border-l-4 border-yellow-500",
                      children: [
                        /* @__PURE__ */ jsx4("p", {
                          className: "font-bold text-white",
                          children: item.category
                        }),
                        /* @__PURE__ */ jsx4("p", {
                          className: "text-gray-300 whitespace-pre-wrap",
                          children: item.feedback
                        })
                      ]
                    }, index))
                  })
                ]
              }),
              /* @__PURE__ */ jsx4("div", {
                children: /* @__PURE__ */ jsxs4("details", {
                  className: "group bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden",
                  open: true,
                  children: [
                    /* @__PURE__ */ jsxs4("summary", {
                      className: "flex items-center justify-between cursor-pointer text-lg font-semibold text-blue-400 hover:bg-gray-800/60 transition-colors p-4",
                      children: [
                        /* @__PURE__ */ jsxs4("div", {
                          className: "flex items-center",
                          children: [
                            /* @__PURE__ */ jsx4("i", {
                              className: "fas fa-lightbulb mr-2"
                            }),
                            /* @__PURE__ */ jsx4("span", {
                              children: "View Suggested Answer"
                            })
                          ]
                        }),
                        /* @__PURE__ */ jsx4("i", {
                          className: "fas fa-chevron-down transform group-open:rotate-180 transition-transform"
                        })
                      ]
                    }),
                    /* @__PURE__ */ jsxs4("div", {
                      className: "border-t border-gray-700 bg-gray-900/50",
                      children: [
                        /* @__PURE__ */ jsx4("div", {
                          className: "border-b border-gray-700",
                          children: /* @__PURE__ */ jsxs4("div", {
                            className: "flex",
                            children: [
                              /* @__PURE__ */ jsx4("button", {
                                onClick: () => setActiveTab("professional"),
                                className: `flex-1 p-3 font-medium text-sm transition-colors ${activeTab === "professional" ? "bg-blue-600/30 text-blue-300 border-b-2 border-blue-400" : "text-gray-400 hover:bg-gray-800"}`,
                                children: "For Professionals"
                              }),
                              /* @__PURE__ */ jsx4("button", {
                                onClick: () => setActiveTab("fresher"),
                                className: `flex-1 p-3 font-medium text-sm transition-colors ${activeTab === "fresher" ? "bg-blue-600/30 text-blue-300 border-b-2 border-blue-400" : "text-gray-400 hover:bg-gray-800"}`,
                                children: "For Freshers"
                              })
                            ]
                          })
                        }),
                        /* @__PURE__ */ jsx4("div", {
                          className: "p-4",
                          children: /* @__PURE__ */ jsx4("blockquote", {
                            className: "text-white whitespace-pre-wrap font-light",
                            children: activeTab === "professional" ? analysis.suggestedAnswerProfessional : analysis.suggestedAnswerFresher
                          })
                        })
                      ]
                    })
                  ]
                })
              })
            ]
          })
        ]
      }),
      /* @__PURE__ */ jsx4("div", {
        className: "text-center pt-4",
        children: /* @__PURE__ */ jsx4("button", {
          onClick: onNextQuestion,
          className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg",
          children: "Ask Next Question"
        })
      })
    ]
  });
};
var AnalysisCard_default = AnalysisCard;

// components/Loader.tsx
import React5 from "react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var Loader = ({ message }) => {
  return /* @__PURE__ */ jsxs5("div", {
    className: "flex flex-col items-center justify-center space-y-4 p-8",
    children: [
      /* @__PURE__ */ jsx5("div", {
        className: "w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"
      }),
      /* @__PURE__ */ jsx5("p", {
        className: "text-lg text-gray-300",
        children: message
      })
    ]
  });
};
var Loader_default = Loader;

// App.tsx
import React6, { useState as useState5, useEffect as useEffect4, useCallback as useCallback3 } from "react";

// services/geminiService.ts
var generateInterviewQuestion = async (options) => {
  try {
    const response = await fetch("/api/generate-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(options)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "An unknown server error occurred." }));
      throw new Error(errorData.message || "Failed to generate question from the server.");
    }
    const data = await response.json();
    return data.question;
  } catch (error) {
    console.error("Error calling /api/generate-question:", error);
    throw new Error("Could not generate a new question from the AI.");
  }
};
var analyzeAnswer = async (question, answer, resumeText) => {
  try {
    const response = await fetch("/api/analyze-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question, answer, resumeText })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "An unknown server error occurred." }));
      throw new Error(errorData.message || "Failed to get analysis from the server.");
    }
    const parsedJson = await response.json();
    if (typeof parsedJson.score !== "number" || typeof parsedJson.suggestedAnswerFresher !== "string" || typeof parsedJson.suggestedAnswerProfessional !== "string") {
      throw new Error("AI response did not match the expected format.");
    }
    return parsedJson;
  } catch (error) {
    console.error("Error calling /api/analyze-answer:", error);
    throw new Error("Could not get analysis from the AI.");
  }
};

// App.tsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var basicQuestions = {
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
var allBasicQuestions = [...basicQuestions.Behavioural, ...basicQuestions["Company Specific"]];
var App = () => {
  const [interviewState, setInterviewState] = useState5(0 /* IDLE */);
  const [currentQuestion, setCurrentQuestion] = useState5("");
  const [userAnswer, setUserAnswer] = useState5("");
  const [analysis, setAnalysis] = useState5(null);
  const [error, setError] = useState5(null);
  const [askedQuestions, setAskedQuestions] = useState5([]);
  const [micPermissionError, setMicPermissionError] = useState5(false);
  const [resumeText, setResumeText] = useState5("");
  const [interviewMode, setInterviewMode] = useState5("random");
  const [basicQuestionIndex, setBasicQuestionIndex] = useState5(0);
  const [isPdfLibReady, setIsPdfLibReady] = useState5(false);
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech({
    onEnd: () => setInterviewState(3 /* LISTENING */),
    onError: () => {
      setError("Sorry, I had trouble speaking the question. Please read it and record your answer.");
    }
  });
  const { isListening, transcript, startListening, stopListening, resetTranscript, error: recognitionError } = useSpeechRecognition();
  useEffect4(() => {
    const interval = setInterval(() => {
      if (window.pdfjsLib) {
        setIsPdfLibReady(true);
        clearInterval(interval);
      }
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.pdfjsLib) {
        console.error("PDF.js library failed to load after 10 seconds.");
        setError("The PDF reader library failed to load. You can still paste your resume text.");
      }
    }, 1e4);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  const handleStartInterview = useCallback3(async () => {
    setError(null);
    setMicPermissionError(false);
    setAnalysis(null);
    setUserAnswer("");
    resetTranscript();
    if (interviewMode === "basic") {
      const nextQuestion = allBasicQuestions[basicQuestionIndex % allBasicQuestions.length];
      setBasicQuestionIndex((prev) => prev + 1);
      setCurrentQuestion(nextQuestion);
      setInterviewState(2 /* ASKING_QUESTION */);
    } else {
      setInterviewState(1 /* GENERATING_QUESTION */);
      try {
        const question = await generateInterviewQuestion({
          askedQuestions,
          resumeText
        });
        setAskedQuestions((prev) => [...prev, question]);
        setCurrentQuestion(question);
        setInterviewState(2 /* ASKING_QUESTION */);
      } catch (err) {
        setError("Failed to generate a question. Please check your API key and try again.");
        setInterviewState(0 /* IDLE */);
      }
    }
  }, [askedQuestions, resetTranscript, resumeText, interviewMode, basicQuestionIndex]);
  useEffect4(() => {
    if (interviewState === 2 /* ASKING_QUESTION */ && currentQuestion) {
      speak(currentQuestion);
    }
  }, [interviewState, currentQuestion, speak]);
  useEffect4(() => {
    if (recognitionError) {
      if (recognitionError === "not-allowed") {
        setError("Microphone access was denied. You'll need to enable it in your browser settings to record your answer.");
        setMicPermissionError(true);
      } else {
        setError(`Speech Recognition Error: ${recognitionError}. Please try again.`);
      }
      setInterviewState(3 /* LISTENING */);
    }
  }, [recognitionError]);
  const handleSubmitAnswer = useCallback3(async () => {
    if (!transcript.trim()) {
      setError("I didn't catch that. Could you please try answering again?");
      setInterviewState(3 /* LISTENING */);
      return;
    }
    setUserAnswer(transcript);
    setInterviewState(4 /* ANALYZING */);
    setError(null);
    try {
      const result = await analyzeAnswer(currentQuestion, transcript, resumeText);
      setAnalysis(result);
      setInterviewState(5 /* SHOWING_ANALYSIS */);
    } catch (err) {
      setError("Failed to analyze your answer. Please try again.");
      setInterviewState(3 /* LISTENING */);
    }
  }, [transcript, currentQuestion, resumeText]);
  const handleSkipQuestion = () => {
    stopSpeaking();
    handleStartInterview();
  };
  const handleResumeTextChange = (event) => {
    setResumeText(event.target.value);
  };
  const handleResumeFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!window.pdfjsLib) {
        setError("PDF processing library is not ready. Please wait a moment and try again.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = window.pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
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
    setInterviewState(0 /* IDLE */);
    setCurrentQuestion("");
    setUserAnswer("");
    setAnalysis(null);
    setError(null);
    setAskedQuestions([]);
    setBasicQuestionIndex(0);
    resetTranscript();
  };
  return /* @__PURE__ */ jsx6("div", {
    className: "min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans",
    children: /* @__PURE__ */ jsxs6("div", {
      className: "w-full max-w-3xl mx-auto flex flex-col items-center",
      children: [
        /* @__PURE__ */ jsxs6("header", {
          className: "w-full text-center mb-8",
          children: [
            /* @__PURE__ */ jsx6("h1", {
              className: "text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300",
              children: "AI Interview Coach"
            }),
            /* @__PURE__ */ jsx6("p", {
              className: "text-gray-400 mt-2",
              children: "Practice your interview skills with an AI-powered coach."
            })
          ]
        }),
        error && /* @__PURE__ */ jsxs6("div", {
          className: "bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full",
          role: "alert",
          children: [
            /* @__PURE__ */ jsx6("strong", {
              className: "font-bold",
              children: "Error: "
            }),
            /* @__PURE__ */ jsx6("span", {
              className: "block sm:inline",
              children: error
            })
          ]
        }),
        /* @__PURE__ */ jsxs6("main", {
          className: "w-full bg-gray-800/50 rounded-lg p-6 md:p-8 shadow-2xl border border-gray-700 min-h-[400px] flex flex-col items-center justify-center",
          children: [
            interviewState === 0 /* IDLE */ && /* @__PURE__ */ jsxs6("div", {
              className: "w-full flex flex-col items-center animate-fade-in space-y-6",
              children: [
                /* @__PURE__ */ jsxs6("div", {
                  className: "w-full",
                  children: [
                    /* @__PURE__ */ jsx6("h3", {
                      className: "text-lg font-semibold text-gray-300 mb-2",
                      children: "Interview Mode"
                    }),
                    /* @__PURE__ */ jsxs6("div", {
                      className: "flex bg-gray-900/60 p-1 rounded-lg border border-gray-700",
                      children: [
                        /* @__PURE__ */ jsx6("button", {
                          onClick: () => setInterviewMode("random"),
                          className: `flex-1 py-2 rounded-md text-sm font-medium transition-colors ${interviewMode === "random" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700"}`,
                          children: "Random Questions"
                        }),
                        /* @__PURE__ */ jsx6("button", {
                          onClick: () => setInterviewMode("basic"),
                          className: `flex-1 py-2 rounded-md text-sm font-medium transition-colors ${interviewMode === "basic" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700"}`,
                          children: "Basic Questions"
                        })
                      ]
                    })
                  ]
                }),
                /* @__PURE__ */ jsxs6("div", {
                  className: "w-full",
                  children: [
                    /* @__PURE__ */ jsx6("h3", {
                      className: "text-lg font-semibold text-gray-300 mb-2",
                      children: "Provide Your Resume (Optional)"
                    }),
                    /* @__PURE__ */ jsx6("p", {
                      className: "text-sm text-gray-500 mb-3",
                      children: "For personalized, resume-based questions, upload or paste your resume content."
                    }),
                    /* @__PURE__ */ jsx6("textarea", {
                      value: resumeText,
                      onChange: handleResumeTextChange,
                      placeholder: "Paste your resume text here...",
                      className: "w-full h-32 p-3 bg-gray-900/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    }),
                    /* @__PURE__ */ jsx6("div", {
                      className: "text-center my-2 text-gray-500",
                      children: "OR"
                    }),
                    /* @__PURE__ */ jsxs6("div", {
                      className: "relative",
                      children: [
                        /* @__PURE__ */ jsx6("input", {
                          type: "file",
                          id: "resume-upload",
                          accept: ".pdf",
                          onChange: handleResumeFileChange,
                          disabled: !isPdfLibReady,
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        }),
                        /* @__PURE__ */ jsxs6("label", {
                          htmlFor: "resume-upload",
                          className: `block w-full text-center py-3 px-4 rounded-lg border-2 border-dashed transition-colors ${!isPdfLibReady ? "bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed" : "bg-gray-800 border-gray-600 hover:border-blue-500 hover:bg-gray-700 text-gray-300 cursor-pointer"}`,
                          children: [
                            /* @__PURE__ */ jsx6("i", {
                              className: "fas fa-upload mr-2"
                            }),
                            !isPdfLibReady ? "Initializing PDF reader..." : "Upload a .pdf file"
                          ]
                        })
                      ]
                    })
                  ]
                }),
                /* @__PURE__ */ jsx6("button", {
                  onClick: handleStartInterview,
                  className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg",
                  children: "Start Interview"
                })
              ]
            }),
            interviewState === 1 /* GENERATING_QUESTION */ && /* @__PURE__ */ jsx6(Loader_default, {
              message: "Generating question..."
            }),
            interviewState === 4 /* ANALYZING */ && /* @__PURE__ */ jsx6(Loader_default, {
              message: "Analyzing your answer..."
            }),
            (interviewState === 2 /* ASKING_QUESTION */ || interviewState === 3 /* LISTENING */) && /* @__PURE__ */ jsxs6("div", {
              className: "w-full animate-fade-in",
              children: [
                /* @__PURE__ */ jsx6(QuestionCard_default, {
                  question: currentQuestion,
                  isSpeaking,
                  onSkip: handleSkipQuestion
                }),
                /* @__PURE__ */ jsx6(Recorder_default, {
                  isListening,
                  onStart: startListening,
                  onStop: stopListening,
                  onSubmit: handleSubmitAnswer,
                  onRetry: resetTranscript,
                  transcript,
                  disabled: isSpeaking || micPermissionError
                })
              ]
            }),
            interviewState === 5 /* SHOWING_ANALYSIS */ && analysis && /* @__PURE__ */ jsx6(AnalysisCard_default, {
              analysis,
              userAnswer,
              onNextQuestion: handleStartInterview
            })
          ]
        }),
        interviewState !== 0 /* IDLE */ && /* @__PURE__ */ jsx6("button", {
          onClick: handleGoHome,
          className: "mt-6 text-gray-400 hover:text-white transition-colors duration-200 text-sm",
          children: [
            /* @__PURE__ */ jsx6("i", {
              className: "fas fa-home mr-1"
            }),
            "End Interview & Go Home"
          ]
        })
      ]
    })
  });
};
var App_default = App;

// index.tsx
import React7 from "react";
import ReactDOM from "react-dom/client";
import { jsx as jsx7 } from "react/jsx-runtime";
var rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
var root = ReactDOM.createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsx7(React7.StrictMode, {
    children: /* @__PURE__ */ jsx7(App_default, {})
  })
);
/*! Bundled license information:

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=index.js.map
