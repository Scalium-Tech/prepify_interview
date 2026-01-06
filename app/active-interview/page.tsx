"use client";

import React, { useState, useEffect, useRef } from "react";
import { m as motion } from "framer-motion";
import { Mic, Volume2, Keyboard, Loader2, StopCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useInterview } from "@/app/context/InterviewContext";
import { useRouter } from "next/navigation";

export default function InterviewSessionPage() {
    const router = useRouter();
    const { questions, setAnswers, answers } = useInterview();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Refs for Speech APIs
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initial Setup & Redirect Safety
    useEffect(() => {
        if (!questions || questions.length === 0) {
            router.push("/interview-setup");
        }

        // Initialize Speech Synthesis
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }

        // Initialize Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    // Appending to existing transcript state wasn't working well with live updates, 
                    // so we append final results to previous value and show interim live.
                    // Simplified strategy: Update input with what we hear.
                    // Better: User edits text manually or speech appends. 
                    // We will just append the *new* final transcript to the state.
                    if (finalTranscript) {
                        setTranscript(prev => {
                            const newText = prev ? `${prev} ${finalTranscript}` : finalTranscript;
                            return newText;
                        });
                    }
                };

                recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                    // toast.error("Microphone error. Please check permissions."); // Optional: Add toast here
                };

                recognitionRef.current.onend = () => {
                    // Auto-restart if it stops but we think it's listening (unless explicitly stopped)
                    // For now, simpler to just set state to false.
                    setIsListening(false);
                };
            }
        }

        return () => {
            stopSpeaking();
            stopListening();
        };
    }, [questions, router]);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Speak Question when it changes
    useEffect(() => {
        if (currentQuestion?.text) {
            // Slight delay to ensure page transition/state is settled
            const timer = setTimeout(() => {
                speakQuestion(currentQuestion.text);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, currentQuestion]);

    const speakQuestion = (text: string) => {
        if (!synthRef.current) return;

        // Cancel existing
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e: any) => {
            console.error("TTS Error", e);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const startListening = () => {
        // Stop speaking if listening starts
        stopSpeaking();

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        } else {
            alert("Speech recognition is not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const handleSubmitAnswer = () => {
        if (!transcript.trim()) {
            // Ideally we'd use a toast here
            // alert("Please provide an answer before moving forward."); // Removed alert to be less intrusive, maybe just don't proceed?
            // Actually, proceeding with empty answer might be valid (skip). But let's prompt.
            const confirmSkip = window.confirm("You haven't provided an answer. Do you want to skip this question?");
            if (!confirmSkip) return;
        }

        // Save answer
        setAnswers(prev => [
            ...prev,
            {
                questionId: currentQuestion.id,
                questionText: currentQuestion.text,
                userAnswer: transcript || "Skipped"
            }
        ]);

        stopSpeaking();
        stopListening();

        // Move to next or finish
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTranscript("");
        } else {
            router.push("/result-page");
        }
    };

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-white text-gray-900 font-sans selection:bg-blue-100 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md pt-6 pb-4 px-6 md:px-8 max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-4">
                    {/* Home Button */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-all duration-200 shadow-sm"
                    >
                        <Home className="h-4 w-4" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Interview in Progress
                    </h1>
                    <span className="text-sm font-medium text-gray-500">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-violet-600 rounded-full"
                    />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 md:px-6 pb-24 pt-6 md:pt-12 flex flex-col items-center flex-grow w-full">
                {/* Question Section */}
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-6 text-gray-900">
                        {currentQuestion.text}
                    </h2>

                    <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(currentQuestion.text)}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                    >
                        {isSpeaking ? <StopCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </motion.div>

                {/* Microphone Visualizer */}
                <div className="relative w-full py-12 flex items-center justify-center mb-8">
                    {/* Ripple Effects */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        {/* Outer Ring */}
                        <motion.div
                            animate={isListening ? {
                                scale: [1, 1.5, 1],
                                opacity: [0.1, 0, 0.1],
                            } : { scale: 1, opacity: 0 }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-red-500/5"
                        />
                        {/* Middle Ring */}
                        <motion.div
                            animate={isListening ? {
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0, 0.2],
                            } : { scale: 1, opacity: 0 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                            className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full bg-red-500/10"
                        />
                    </div>

                    {/* Main Mic Button */}
                    <motion.button
                        onClick={toggleListening}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                            isListening
                                ? "bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/40"
                                : "bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
                        )}
                    >
                        {/* Inner Pulse when active */}
                        {isListening && (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 bg-white/20 rounded-full"
                            />
                        )}
                        <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </motion.button>
                </div>

                {/* Transcript Area */}
                <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">Live Transcript</span>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            {isListening ? (
                                <span className="flex items-center gap-1 text-red-500 font-medium animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    Listening...
                                </span>
                            ) : "Click mic to speak"}
                        </div>
                    </div>

                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Type your answer here..."}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] text-gray-600 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    />
                </div>
            </main>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleSubmitAnswer}
                        size="lg"
                        disabled={isListening}
                        className={cn(
                            "w-full h-14 text-lg font-semibold rounded-xl shadow-none transition-all duration-200",
                            isListening
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-violet-600 hover:text-white hover:shadow-lg"
                        )}
                    >
                        {isListening ? "Stop Listening to Continue" : (currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
