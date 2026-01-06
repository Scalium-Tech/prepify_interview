import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/resume-parser";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        try {
            const text = await parseResumeFile(buffer, file.type, file.name);
            return NextResponse.json({ text });
        } catch (parseError: any) {
            return NextResponse.json(
                { error: parseError.message || "Failed to parse resume content." },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error("Error processing resume request:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
