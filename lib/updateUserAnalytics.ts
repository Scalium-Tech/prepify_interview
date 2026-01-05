import { SupabaseClient } from "@supabase/supabase-js";

interface Interview {
    id: string;
    marks: number;
    category: string;
    interview_date: string;
    script: any;
}

interface AnalyticsData {
    total_interviews: number;
    avg_score: number;
    best_score: number;
    latest_score: number;
    score_improvement: number;
    current_streak: number;
    last_interview_date: string | null;
    category_stats: Record<string, { avgScore: number; count: number }>;
    top_strengths: string[];
    top_weaknesses: string[];
    pro_tip: string;
}

/**
 * Computes analytics from all user interviews and updates the user_analytics table
 */
export async function updateUserAnalytics(
    supabase: SupabaseClient,
    userId: string
): Promise<AnalyticsData | null> {
    try {
        // 1. Fetch all interviews for this user
        const { data: interviews, error } = await supabase
            .from("interviews")
            .select("id, marks, category, interview_date, script")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Failed to fetch interviews for analytics:", error);
            return null;
        }

        if (!interviews || interviews.length === 0) {
            console.log("No interviews found for user, skipping analytics update");
            return null;
        }

        // 2. Compute core metrics
        const totalInterviews = interviews.length;
        const avgScore = Math.round(
            interviews.reduce((sum, iv) => sum + iv.marks, 0) / totalInterviews
        );
        const bestScore = Math.max(...interviews.map((iv) => iv.marks));
        const latestScore = interviews[interviews.length - 1]?.marks || 0;
        const previousScore =
            interviews.length > 1
                ? interviews[interviews.length - 2]?.marks
                : latestScore;
        const scoreImprovement = latestScore - previousScore;

        // 3. Compute category stats
        const categoryStats: Record<string, { total: number; count: number }> = {};
        interviews.forEach((iv) => {
            const cat = iv.category?.toLowerCase() || "general";
            if (!categoryStats[cat]) categoryStats[cat] = { total: 0, count: 0 };
            categoryStats[cat].total += iv.marks;
            categoryStats[cat].count += 1;
        });

        const categoryData: Record<string, { avgScore: number; count: number }> = {};
        Object.entries(categoryStats).forEach(([category, stats]) => {
            categoryData[category] = {
                avgScore: Math.round(stats.total / stats.count),
                count: stats.count,
            };
        });

        // 4. Aggregate strengths and weaknesses
        const allStrengths: Record<string, number> = {};
        const allWeaknesses: Record<string, number> = {};

        interviews.forEach((iv) => {
            try {
                const script =
                    typeof iv.script === "string" ? JSON.parse(iv.script) : iv.script;
                const feedback = script?.feedback || script;

                (feedback?.strengths || []).forEach((s: string) => {
                    const key = s.substring(0, 50);
                    allStrengths[key] = (allStrengths[key] || 0) + 1;
                });

                (feedback?.weaknesses || []).forEach((w: string) => {
                    const key = w.substring(0, 50);
                    allWeaknesses[key] = (allWeaknesses[key] || 0) + 1;
                });
            } catch (e) {
                // Ignore parse errors
            }
        });

        const topStrengths = Object.entries(allStrengths)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text]) => text);

        const topWeaknesses = Object.entries(allWeaknesses)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text]) => text);

        // 5. Calculate streak
        const dateSet = new Set(interviews.map((iv) => iv.interview_date));
        const dates = Array.from(dateSet).sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

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

        // 6. Generate Pro Tip based on performance
        let proTip = "Keep practicing to improve your interview skills!";
        if (avgScore < 60) {
            proTip =
                "Focus on structured responses using the STAR method (Situation, Task, Action, Result) to improve your scores.";
        } else if (avgScore < 80) {
            proTip =
                "Great progress! Try practicing with higher difficulty levels to challenge yourself and reach 80%+.";
        } else {
            proTip =
                "Excellent work! Consider practicing different categories to become a well-rounded interviewee.";
        }

        // 7. Prepare analytics object
        const analytics: AnalyticsData = {
            total_interviews: totalInterviews,
            avg_score: avgScore,
            best_score: bestScore,
            latest_score: latestScore,
            score_improvement: scoreImprovement,
            current_streak: streak,
            last_interview_date: dates[0] || null,
            category_stats: categoryData,
            top_strengths: topStrengths,
            top_weaknesses: topWeaknesses,
            pro_tip: proTip,
        };

        // 8. Upsert into user_analytics table
        const { error: upsertError } = await supabase.from("user_analytics").upsert(
            {
                user_id: userId,
                ...analytics,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        if (upsertError) {
            console.error("Failed to update user_analytics:", upsertError);
            return null;
        }

        console.log("User analytics updated successfully:", analytics);
        return analytics;
    } catch (err) {
        console.error("Error in updateUserAnalytics:", err);
        return null;
    }
}
