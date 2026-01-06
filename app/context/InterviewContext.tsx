"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type InterviewSetup = {
    resumeText: string;
    category: string;
    difficulty: string;
    questionCount: number;
    jobDescription: string;
};

type Question = {
    id: number;
    text: string;
};

type Answer = {
    questionId: number;
    questionText: string;
    userAnswer: string;
};

type QuestionFeedback = {
    questionNumber: number;
    question: string;
    answer: string;
    feedback: string;
    rating: "good" | "average" | "needs_improvement";
};

type InterviewReport = {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    questionFeedback?: QuestionFeedback[];
};

interface InterviewContextType {
    setup: InterviewSetup;
    setSetup: React.Dispatch<React.SetStateAction<InterviewSetup>>;
    questions: Question[];
    setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
    answers: Answer[];
    setAnswers: React.Dispatch<React.SetStateAction<Answer[]>>;
    report: InterviewReport | null;
    setReport: React.Dispatch<React.SetStateAction<InterviewReport | null>>;
    resumeFile: File | null;
    setResumeFile: React.Dispatch<React.SetStateAction<File | null>>;
    resumeId: string | null;
    setResumeId: React.Dispatch<React.SetStateAction<string | null>>;
    resumeSourceUrl: string | null;
    setResumeSourceUrl: React.Dispatch<React.SetStateAction<string | null>>;
    isLoaded: boolean;
    resetInterview: () => void;
}


const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: ReactNode }) {
    const [setup, setSetup] = useState<InterviewSetup>({
        resumeText: "",
        category: "hr",
        difficulty: "medium",
        questionCount: 5,
        jobDescription: "",
    });

    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [report, setReport] = useState<InterviewReport | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [resumeSourceUrl, setResumeSourceUrl] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const resetInterview = () => {
        setSetup({
            resumeText: "",
            category: "hr",
            difficulty: "medium",
            questionCount: 5,
            jobDescription: "",
        });
        setQuestions([]);
        setAnswers([]);
        setReport(null);
        setResumeFile(null);
        setResumeId(null);
        setResumeSourceUrl(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem("interview_state");
        }
    };

    // Load state from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedState = localStorage.getItem("interview_state");
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    if (parsed.setup) setSetup(parsed.setup);
                    if (parsed.questions) setQuestions(parsed.questions);
                    if (parsed.answers) setAnswers(parsed.answers);
                    if (parsed.report) setReport(parsed.report);
                    if (parsed.resumeId) setResumeId(parsed.resumeId);
                    if (parsed.resumeSourceUrl) setResumeSourceUrl(parsed.resumeSourceUrl);
                } catch (e) {
                    console.error("Failed to parse interview state", e);
                }
            }
            setIsLoaded(true);
        } else {
            setIsLoaded(true);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stateToSave = {
                setup,
                questions,
                answers,
                report,
                resumeId,
                resumeSourceUrl
                // We do not save resumeFile as it is not serializable
            };
            localStorage.setItem("interview_state", JSON.stringify(stateToSave));
        }
    }, [setup, questions, answers, report, resumeId, resumeSourceUrl]);

    const value = React.useMemo(() => ({
        setup,
        setSetup,
        questions,
        setQuestions,
        answers,
        setAnswers,
        report,
        setReport,
        resumeFile,
        setResumeFile,
        resumeId,
        setResumeId,
        resumeSourceUrl,
        setResumeSourceUrl,
        isLoaded,
        resetInterview,
    }), [setup, questions, answers, report, resumeFile, resumeId, resumeSourceUrl, isLoaded]);

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
}

export function useInterview() {
    const context = useContext(InterviewContext);
    if (context === undefined) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    return context;
}
