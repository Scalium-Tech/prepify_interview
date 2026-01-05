import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
    try {
        // Validate API key
        if (!apiKey) {
            console.error("Gemini API key is not configured");
            return NextResponse.json(
                { error: "AI service not configured. Please contact support." },
                { status: 503 }
            );
        }

        const { questions, answers, category, difficulty } = await req.json();
        console.log("Generating report for:", { category, difficulty, questionsCount: questions?.length });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Build question-answer pairs for the prompt
        const qaList = questions.map((q: any, i: number) => {
            const answer = answers.find((a: any) => a.questionId === q.id);
            return {
                questionNumber: i + 1,
                question: q.text,
                answer: answer?.userAnswer || "No answer provided."
            };
        });

        const transcript = qaList.map((qa: any) =>
            `Question ${qa.questionNumber}: ${qa.question}\nAnswer: ${qa.answer}`
        ).join("\n\n");

        const prompt = `
You are an expert interview evaluator. Analyze the following interview transcript and provide a detailed report.

Context:
- Category: ${category}
- Difficulty: ${difficulty}

Transcript:
${transcript}

Provide the output as a raw JSON object with the following structure:
{
  "score": number (0-100),
  "feedback": "Overall summary of performance",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "questionFeedback": [
    {
      "questionNumber": 1,
      "question": "The interview question",
      "answer": "The user's answer",
      "feedback": "Specific feedback for this answer including strengths, areas for improvement, and suggestions",
      "rating": "good" | "average" | "needs_improvement"
    },
    ...for each question
  ]
}

For each question in questionFeedback:
- Provide specific, actionable feedback
- Mention what was done well
- Suggest how the answer could be improved
- Rate the answer as "good", "average", or "needs_improvement"

Do not include markdown formatting. Return only the raw JSON.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("Gemini response received, length:", responseText.length);

        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        const report = JSON.parse(cleanedText);
        console.log("Report generated successfully, score:", report.score);

        return NextResponse.json(report);
    } catch (error: any) {
        console.error("Error generating report:", error.message || error);
        return NextResponse.json(
            { error: `Failed to generate report: ${error.message || "Unknown error"}` },
            { status: 500 }
        );
    }
}
