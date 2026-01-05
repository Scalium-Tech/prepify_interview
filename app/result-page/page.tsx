"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/app/context/InterviewContext";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, BarChart3, BookOpen, Download, MessageSquare, ThumbsUp, AlertCircle, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function InterviewResultsPage() {
    const router = useRouter();
    const { questions, answers, setup, report, setReport, resetInterview } = useInterview();
    const { isPro, loading: subLoading, refreshSubscription } = useSubscription();
    const [isLoading, setIsLoading] = useState(true);
    const processedRef = useRef(false);

    useEffect(() => {
        if (!questions.length || !answers.length) {
            router.push("/interview-setup");
            return;
        }

        const processResult = async () => {
            if (processedRef.current || report) {
                setIsLoading(false);
                return;
            }
            processedRef.current = true;

            try {
                // 1. Generate Report
                const res = await fetch("/api/interview/generate-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questions,
                        answers,
                        category: setup.category,
                        difficulty: setup.difficulty,
                    }),
                });

                if (!res.ok) throw new Error("Failed to generate report");
                const data = await res.json();
                setReport(data);

                // 2. Get User & Save Result
                const { supabase } = await import("@/lib/supabase");

                const { data: { session } } = await supabase.auth.getSession();

                console.log("Saving Result... Session:", session?.user?.id);

                if (session?.user) {
                    const now = new Date();
                    const interviewDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
                    const interviewTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

                    const scriptData = JSON.stringify({
                        questions,
                        answers,
                        feedback: data
                    });

                    const { data: insertData, error } = await supabase
                        .from("interviews")
                        .insert({
                            user_id: session.user.id,
                            category: setup.category,
                            marks: data.score,
                            script: scriptData,
                            interview_date: interviewDate,
                            interview_time: interviewTime,
                            created_at: now.toISOString()
                        })
                        .select(); // Select to confirm insert

                    if (error) {
                        console.error("Supabase Save Error:", error, error.message, error.details);
                        alert(`Error saving result: ${error.message}`);
                    } else {
                        console.log("Supabase Insert Success:", insertData);

                        // Update cached dashboard analytics
                        const { updateUserAnalytics } = await import("@/lib/updateUserAnalytics");
                        await updateUserAnalytics(supabase, session.user.id);

                        // Refresh subscription data to update interview count
                        // This ensures the home page shows updated button text immediately
                        await refreshSubscription();
                    }
                } else {
                    console.error("No active session found for saving.");
                }

            } catch (error) {
                console.error("Detailed Process Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        processResult();
    }, [questions, answers, report, setup, router, setReport]);

    const handleRestart = () => {
        // Check if user has a paid subscription
        if (!isPro) {
            // Free users get redirected to pricing page
            router.push("/pricing?upgrade=simulation");
            return;
        }
        // Pro users can start a new simulation
        resetInterview();
        router.push("/interview-setup");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Generating your performance report...</h2>
                <p className="text-gray-500 mt-2">AI is analyzing your answers.</p>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center justify-center p-3 bg-violet-100 rounded-full mb-4"
                    >
                        <BarChart3 className="w-8 h-8 text-violet-600" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Interview Analysis</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Here is a detailed breakdown of your performance in the {setup.category} interview.
                    </p>
                </div>

                {/* Score Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-violet-900/5 border border-white/50 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Score</h2>
                        <p className="text-gray-500">Based on clarity, relevance, and technical depth.</p>
                    </div>
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-gray-100"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * report.score) / 100}
                                className={cn(
                                    "transition-all duration-1000 ease-out",
                                    report.score >= 80 ? "text-green-500" :
                                        report.score >= 60 ? "text-yellow-500" : "text-red-500"
                                )}
                            />
                        </svg>
                        <span className="absolute text-4xl font-bold text-gray-900">{report.score}%</span>
                    </div>
                </motion.div>

                {/* Feedback Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl p-8 shadow-lg border border-green-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <h3 className="text-xl font-bold text-gray-900">Key Strengths</h3>
                        </div>
                        <ul className="space-y-4">
                            {report.strengths.map((point: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Weaknesses */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-8 shadow-lg border border-red-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                            <h3 className="text-xl font-bold text-gray-900">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-4">
                            {report.weaknesses.map((point: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Detailed Feedback */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl p-8 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="w-6 h-6 text-violet-600" />
                        <h3 className="text-xl font-bold text-gray-900">Overall Feedback</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {report.feedback}
                    </p>
                </motion.div>

                {/* Question-wise Feedback Section */}
                {report.questionFeedback && report.questionFeedback.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-6 h-6 text-violet-600" />
                            <h3 className="text-xl font-bold text-gray-900">Question-wise Feedback</h3>
                        </div>

                        {report.questionFeedback.map((qf: any, index: number) => (
                            <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                            >
                                {/* Question Header */}
                                <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-violet-600">
                                            Question {qf.questionNumber}
                                        </span>
                                        {qf.rating === "good" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                <ThumbsUp className="w-3 h-3" />
                                                Good
                                            </span>
                                        )}
                                        {qf.rating === "average" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                                <TrendingUp className="w-3 h-3" />
                                                Average
                                            </span>
                                        )}
                                        {qf.rating === "needs_improvement" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                                <AlertCircle className="w-3 h-3" />
                                                Needs Improvement
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-900 font-medium">{qf.question}</p>
                                </div>

                                {/* Answer */}
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Answer</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {qf.answer || "No answer provided"}
                                    </p>
                                </div>

                                {/* Feedback */}
                                <div className="px-6 py-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Feedback</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {qf.feedback}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-center pt-8 gap-4 print:hidden">
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        size="lg"
                        className="h-14 px-8 text-lg font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    >
                        <Download className="mr-2 w-5 h-5" />
                        Download Report
                    </Button>
                    <Button
                        onClick={handleRestart}
                        size="lg"
                        className={cn(
                            "h-14 px-8 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all",
                            isPro
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        )}
                    >
                        {isPro ? (
                            <>
                                <RefreshCw className="mr-2 w-5 h-5" />
                                Start New Simulation
                            </>
                        ) : (
                            <>
                                <Crown className="mr-2 w-5 h-5" />
                                Upgrade to Pro
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
