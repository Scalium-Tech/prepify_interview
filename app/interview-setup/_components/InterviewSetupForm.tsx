"use client";

import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useInterview } from "@/app/context/InterviewContext";
import {
    Briefcase,
    MessagesSquare,
    Users,
    Code2,
    GraduationCap,
    Leaf,
    Award,
    UserCog,
    Zap,
    Trophy,
    Rocket,
    Loader2,
    FileText
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "hr", label: "HR", icon: Briefcase, description: "General HR questions" },
    { id: "behavioral", label: "Behavioral", icon: Users, description: "STAR method questions" },
    { id: "technical", label: "Technical", icon: Code2, description: "Technical & coding questions" },
    { id: "skill-based", label: "Skill-Based", icon: Zap, description: "Role-specific skill assessment" },
    { id: "educational", label: "Educational", icon: GraduationCap, description: "Academic background focus" },
    { id: "communication", label: "Communication", icon: MessagesSquare, description: "Communication skills" },
    { id: "project", label: "Project-Based", icon: FileText, description: "Project experience focus" },
    { id: "managerial", label: "Managerial", icon: UserCog, description: "Leadership & management" },
    { id: "stress", label: "Stress/Rapid-Fire", icon: Trophy, description: "Quick thinking under pressure" },
    { id: "other", label: "Other", icon: Award, description: "Hobbies, achievements & extracurriculars" },
];

const DIFFICULTIES = [
    { id: "easy", label: "Easy" },
    { id: "medium", label: "Medium" },
    { id: "hard", label: "Hard" },
];

export function InterviewSetupForm() {
    const router = useRouter();
    const { setup, setSetup, setQuestions, setAnswers, setReport } = useInterview();
    const [isGenerating, setIsGenerating] = useState(false);

    const updateCategory = (id: string) => setSetup(prev => ({ ...prev, category: id }));
    const updateDifficulty = (id: string) => setSetup(prev => ({ ...prev, difficulty: id }));
    const updateCount = (val: number[]) => setSetup(prev => ({ ...prev, questionCount: val[0] }));

    const handleStartSimulation = async () => {
        setIsGenerating(true);
        console.log("Starting simulation with setup:", setup); // Debug log

        // Clear old interview data before starting new one
        setAnswers([]);
        setReport(null);

        // Validation
        if (!setup.resumeText && !setup.jobDescription) {
            alert("Please upload a resume or provide a job description.");
            setIsGenerating(false);
            return;
        }

        try {
            const res = await fetch("/api/interview/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(setup),
            });

            console.log("API Response Status:", res.status); // Debug log

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("API Error Details:", errorData);
                throw new Error(errorData.error || "Failed to generate questions");
            }

            if (!res.ok) throw new Error("Failed to generate questions");

            const data = await res.json();
            setQuestions(data.questions.map((text: string, index: number) => ({ id: index + 1, text })));

            router.push("/active-interview");
        } catch (error: any) {
            console.error("Simulation Error:", error);
            alert(`Error: ${error.message || "Failed to start simulation"}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-8 md:p-10 border border-white/50">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Interview Setup</h2>

            {/* Step 1: Category */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-xs font-bold">1</span>
                        Interview Category
                    </label>
                </div>

                <Select value={setup.category} onValueChange={updateCategory}>
                    <SelectTrigger className="w-full mb-8 py-7 rounded-2xl border-gray-200 bg-white/50 hover:bg-white hover:border-violet-300 transition-all duration-300 focus:ring-4 focus:ring-violet-100 shadow-sm">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                        <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-gray-400 border border-gray-100">or choose below</span>
                    </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-transparent">
                    <div className="grid grid-cols-2 gap-3 md:gap-4 pb-2">
                        {CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isSelected = setup.category === category.id;
                            return (
                                <motion.button
                                    key={category.id}
                                    onClick={() => updateCategory(category.id)}
                                    className={cn(
                                        "relative flex items-center p-3 md:p-4 rounded-2xl border transition-all duration-300 min-h-[72px] group text-left",
                                        isSelected
                                            ? "border-violet-500 bg-violet-50/50 shadow-md shadow-violet-500/10"
                                            : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-violet-200"
                                    )}
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="absolute inset-0 bg-violet-500/5 rounded-2xl -z-10"
                                        />
                                    )}
                                    <div className={cn(
                                        "flex-shrink-0 p-2 rounded-xl transition-colors duration-300 mr-3",
                                        isSelected ? "bg-violet-100 text-violet-600" : "bg-gray-50 text-gray-500 group-hover:bg-violet-50/50 group-hover:text-violet-500"
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-semibold leading-tight transition-colors break-words w-full",
                                        isSelected ? "text-violet-700" : "text-gray-600 group-hover:text-gray-800"
                                    )}>
                                        {category.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Step 2: Difficulty */}
            <div className="mb-10">
                <label className="text-base font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-xs font-bold">2</span>
                    Difficulty Level
                </label>
                <div className="flex p-1.5 bg-gray-100/80 rounded-full border border-gray-200">
                    {DIFFICULTIES.map((diff) => {
                        const isSelected = setup.difficulty === diff.id;
                        return (
                            <button
                                key={diff.id}
                                onClick={() => updateDifficulty(diff.id)}
                                className={cn(
                                    "relative flex-1 py-3 text-sm font-semibold rounded-full transition-all duration-300 z-0",
                                    isSelected ? "text-white shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeDifficulty"
                                        className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full -z-10 shadow-lg shadow-violet-500/30"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                {diff.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step 3: Question Count */}
            <div className="mb-12">
                <label className="text-base font-semibold text-gray-800 mb-8 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-xs font-bold">3</span>
                    Number of Questions
                </label>
                <div className="flex items-center gap-8 px-2">
                    <div className="relative flex-1 py-2">
                        <Slider
                            value={[setup.questionCount]}
                            onValueChange={updateCount}
                            max={50}
                            min={5}
                            step={1}
                            className="cursor-pointer"
                        />
                        <div className="flex justify-between mt-3">
                            <span className="text-xs font-medium text-gray-400">5 Questions</span>
                            <span className="text-xs font-medium text-gray-400">50 Questions</span>
                        </div>
                    </div>
                    <motion.div
                        key={setup.questionCount}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-16 flex flex-col items-center justify-center rounded-2xl border-2 border-violet-100 bg-violet-50/50 shadow-sm"
                    >
                        <span className="text-2xl font-bold text-violet-600 leading-none">{setup.questionCount}</span>
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide">Questions</span>
                    </motion.div>
                </div>
            </div>


            {/* CTA */}
            <Button
                onClick={handleStartSimulation}
                disabled={isGenerating}
                className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-violet-600/20 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-violet-600/30 transition-all duration-300 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out skew-y-12" />
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        <span>Generating Interview...</span>
                    </>
                ) : (
                    <>
                        <Rocket className="mr-3 h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 relative z-10" />
                        <span className="relative z-10">Start Simulation</span>
                    </>
                )}
            </Button>
        </div>
    );
}
