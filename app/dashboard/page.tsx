"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useSubscription } from "@/app/context/SubscriptionContext";
import {
  LogOut, PlusCircle, TrendingUp, Award, Home, Target,
  Zap, Trophy, Calendar, BarChart3, Lightbulb, Flame,
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { m as motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

import { ScriptModal } from "@/components/dashboard/ScriptModal";
import { ReportModal } from "@/components/dashboard/ReportModal";

// Lazy load charts to reduce initial bundle size
const PerformanceGrowthChart = dynamic(
  () => import("@/components/dashboard/PerformanceGrowthChart"),
  {
    loading: () => <div className="h-[280px] w-full bg-slate-100/50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

const CategoryPerformanceChart = dynamic(
  () => import("@/components/dashboard/CategoryPerformanceChart"),
  {
    loading: () => <div className="h-[280px] w-full bg-slate-100/50 animate-pulse rounded-xl" />,
    ssr: false
  }
);

interface Interview {
  id: string;
  created_at: string;
  category: string;
  difficulty: string;
  marks: number;
  script: any;
  interview_date: string;
  interview_time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [cachedAnalytics, setCachedAnalytics] = useState<any>(null);

  // Modal States
  const [isScriptOpen, setIsScriptOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { user, loading: authLoading, signOut } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();

  useEffect(() => {
    const loadDashboard = async () => {
      if (authLoading || subLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      // Redirect logic removed to allow Free users to access dashboard logic
      // if (!isPro) ...

      setUserEmail(user.email || "");

      const { supabase } = await import("@/lib/supabase");
      const [profileResult, interviewResult, analyticsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("interviews")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("user_analytics")
          .select("*")
          .eq("user_id", user.id)
          .single()
      ]);

      if (profileResult.data) setFullName(profileResult.data.full_name || "");
      if (interviewResult.data) setInterviews(interviewResult.data as Interview[]);
      if (analyticsResult.data) setCachedAnalytics(analyticsResult.data);

      setLoading(false);
    };

    loadDashboard();
  }, [user, authLoading, subLoading, isPro, router]);

  // Calculate analytics - use cached data if available, otherwise compute
  const analytics = useMemo(() => {
    // If we have cached analytics from user_analytics table, use it
    if (cachedAnalytics) {
      // Transform cached data to match the expected format
      const categoryData = Object.entries(cachedAnalytics.category_stats || {}).map(
        ([category, stats]: [string, any]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          avgScore: stats.avgScore,
          count: stats.count,
        })
      );

      return {
        totalInterviews: cachedAnalytics.total_interviews,
        avgScore: cachedAnalytics.avg_score,
        bestScore: cachedAnalytics.best_score,
        latestScore: cachedAnalytics.latest_score,
        improvement: cachedAnalytics.score_improvement,
        categoryData,
        topStrengths: cachedAnalytics.top_strengths || [],
        topWeaknesses: cachedAnalytics.top_weaknesses || [],
        streak: cachedAnalytics.current_streak,
        proTip: cachedAnalytics.pro_tip,
      };
    }

    // Fallback: compute from interviews if no cached data
    if (interviews.length === 0) return null;

    const totalInterviews = interviews.length;
    const avgScore = Math.round(interviews.reduce((sum, iv) => sum + iv.marks, 0) / totalInterviews);
    const bestScore = Math.max(...interviews.map(iv => iv.marks));
    const latestScore = interviews[interviews.length - 1]?.marks || 0;
    const previousScore = interviews.length > 1 ? interviews[interviews.length - 2]?.marks : latestScore;
    const improvement = latestScore - previousScore;

    // Category performance
    const categoryStats: Record<string, { total: number; count: number }> = {};
    interviews.forEach(iv => {
      const cat = iv.category?.toLowerCase() || 'general';
      if (!categoryStats[cat]) categoryStats[cat] = { total: 0, count: 0 };
      categoryStats[cat].total += iv.marks;
      categoryStats[cat].count += 1;
    });

    const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      avgScore: Math.round(stats.total / stats.count),
      count: stats.count,
    }));

    // Aggregate strengths and weaknesses from all interviews
    const allStrengths: Record<string, number> = {};
    const allWeaknesses: Record<string, number> = {};

    interviews.forEach(iv => {
      try {
        const script = typeof iv.script === 'string' ? JSON.parse(iv.script) : iv.script;
        const feedback = script?.feedback || script;

        (feedback?.strengths || []).forEach((s: string) => {
          const key = s.substring(0, 50);
          allStrengths[key] = (allStrengths[key] || 0) + 1;
        });

        (feedback?.weaknesses || []).forEach((w: string) => {
          const key = w.substring(0, 50);
          allWeaknesses[key] = (allWeaknesses[key] || 0) + 1;
        });
      } catch (e) { }
    });

    const topStrengths = Object.entries(allStrengths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => text);

    const topWeaknesses = Object.entries(allWeaknesses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => text);

    // Calculate streak (consecutive days with interviews)
    const dateSet = new Set(interviews.map(iv => iv.interview_date));
    const dates = Array.from(dateSet).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (diff <= 1) streak++;
        else break;
      }
    }

    return {
      totalInterviews,
      avgScore,
      bestScore,
      latestScore,
      improvement,
      categoryData,
      topStrengths,
      topWeaknesses,
      streak,
    };
  }, [interviews, cachedAnalytics]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const startInterview = () => {
    // If user is NOT Pro and has already done at least one interview, redirect to pricing
    if (!isPro && interviews.length > 0) {
      router.push("/pricing");
      return;
    }
    router.push("/interview-setup");
  };

  const openScript = (script: any) => {
    setSelectedScript(script);
    setIsScriptOpen(true);
  };

  const openReport = (script: any) => {
    let parsed = script;
    if (typeof script === "string") {
      try { parsed = JSON.parse(script); } catch (e) { }
    }
    setSelectedReport(parsed);
    setIsReportOpen(true);
  };

  if (loading || authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Empty State
  if (interviews.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader email={userEmail} onSignOut={handleSignOut} />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusCircle className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Give your first interview to see your dashboard</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start your journey to mastering interviews today. Take your first AI-powered mock interview now.
            </p>
            <Button onClick={startInterview} size="lg" className="rounded-xl px-8 h-12 text-base bg-violet-600 hover:bg-violet-700">
              {!isPro ? "Start Free Interview" : "Start Interview"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Prepare Data
  const graphData = interviews.map((iv) => ({
    date: iv.interview_date ? new Date(iv.interview_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
    marks: iv.marks,
  }));

  const tableInterviews = [...interviews].reverse();

  // const categoryColors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#6366f1"]; // Moved to component

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={userEmail} onSignOut={handleSignOut} />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Welcome Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {fullName || "Candidate"}</p>
          </div>
          <Button
            onClick={startInterview}
            className={`rounded-xl ${!isPro && interviews.length > 0 ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md" : "bg-violet-600 hover:bg-violet-700"}`}
          >
            {!isPro && interviews.length > 0 ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Get the Paid Version
              </>
            ) : (
              isPro ? "Start Interview" : " Start Interview" // Using Start Interview for consistency, or + New Interview if preferred. User asked for "Start Interview".
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              icon={<Target className="w-5 h-5" />}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              label="Total Interviews"
              value={analytics.totalInterviews}
            />
            <StatsCard
              icon={<BarChart3 className="w-5 h-5" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Average Score"
              value={`${analytics.avgScore}%`}
            />
            <StatsCard
              icon={<Trophy className="w-5 h-5" />}
              iconBg="bg-yellow-100"
              iconColor="text-yellow-600"
              label="Best Score"
              value={`${analytics.bestScore}%`}
            />
            <StatsCard
              icon={analytics.improvement >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              iconBg={analytics.improvement >= 0 ? "bg-green-100" : "bg-red-100"}
              iconColor={analytics.improvement >= 0 ? "text-green-600" : "text-red-600"}
              label="Last Change"
              value={`${analytics.improvement >= 0 ? '+' : ''}${analytics.improvement}%`}
              valueColor={analytics.improvement >= 0 ? "text-green-600" : "text-red-600"}
            />
          </div>
        )}

        {/* Practice Streak */}
        {analytics && analytics.streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center justify-between text-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{analytics.streak} Day Streak! 🔥</p>
                <p className="text-white/80 text-sm">Keep practicing to maintain your streak</p>
              </div>
            </div>
            <Button onClick={startInterview} variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
              Continue Streak
            </Button>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Performance Growth Chart */}
          {interviews.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Performance Growth</h2>
              </div>
              <PerformanceGrowthChart data={graphData} />
            </motion.div>
          )}

          {/* Category Performance */}
          {analytics && analytics.categoryData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">By Category</h2>
              </div>
              <CategoryPerformanceChart data={analytics.categoryData} />
            </motion.div>
          )}
        </div>

        {/* Skill Analysis Section */}
        {analytics && (analytics.topStrengths.length > 0 || analytics.topWeaknesses.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Your Strengths</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Based on feedback across all interviews</p>
              <ul className="space-y-3">
                {analytics.topStrengths.map((strength: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{strength}...</span>
                  </li>
                ))}
                {analytics.topStrengths.length === 0 && (
                  <li className="text-gray-400 italic">Complete more interviews to see patterns</li>
                )}
              </ul>
            </motion.div>

            {/* Areas for Improvement */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Focus Areas</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Recurring areas that need attention</p>
              <ul className="space-y-3">
                {analytics.topWeaknesses.map((weakness: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{weakness}...</span>
                  </li>
                ))}
                {analytics.topWeaknesses.length === 0 && (
                  <li className="text-gray-400 italic">Complete more interviews to see patterns</li>
                )}
              </ul>
            </motion.div>
          </div>
        )}

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">💡 Pro Tip</h3>
              <p className="text-white/90 leading-relaxed">
                {analytics && analytics.avgScore < 60
                  ? "Focus on structured responses using the STAR method (Situation, Task, Action, Result) to improve your scores."
                  : analytics && analytics.avgScore < 80
                    ? "Great progress! Try practicing with higher difficulty levels to challenge yourself and reach 80%+."
                    : "Excellent work! Consider practicing different categories to become a well-rounded interviewee."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Interviews Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Recent Interviews</h2>
            <span className="text-sm text-gray-500">{interviews.length} Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Report</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableInterviews.slice(0, 10).map((iv) => (
                  <tr key={iv.id} className="hover:bg-violet-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {iv.interview_date ? new Date(iv.interview_date).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{iv.interview_time || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full capitalize">
                        {iv.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${iv.marks >= 80 ? 'text-green-600' : iv.marks >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {iv.marks}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openReport(iv.script)}
                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-violet-600 transition-colors"
                      >
                        <Trophy className="w-4 h-4" />
                        View Report
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openScript(iv.script)}
                        className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1 ml-auto"
                      >
                        <Award className="w-4 h-4" />
                        View Script
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ScriptModal isOpen={isScriptOpen} onClose={() => setIsScriptOpen(false)} script={selectedScript} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} reportData={selectedReport} />
    </div>
  );
}

// Stats Card Component
function StatsCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = "text-gray-900"
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </motion.div>
  );
}

// Dashboard Header Component
function DashboardHeader({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-all duration-200 shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Award className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Preply</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden md:inline-block">{email}</span>
          <Button variant="outline" size="sm" onClick={onSignOut} className="text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
