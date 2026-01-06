import { NextResponse } from "next/server";

export async function parseResumeFile(buffer: Buffer, fileType: string, fileName: string): Promise<string> {
    let text = "";

    try {
        if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
            const pdfModule = (await import("pdf-parse-new")) as any;
            const pdf = pdfModule.default || pdfModule;
            const data = await pdf(buffer);
            text = data.text;
        } else if (
            fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            fileName.endsWith(".docx")
        ) {
            const mammoth = (await import("mammoth")).default || (await import("mammoth"));
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (fileType === "application/msword" || fileName.endsWith(".doc")) {
            throw new Error("Legacy Word documents (.doc) are not supported. Please convert to .docx or .pdf.");
        } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
            text = buffer.toString("utf-8");
        } else {
            // Try to infer from content if possible, or fail gracefully
            // For now, simple extension/mime checks
            throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
        }

        // Basic cleaning
        text = text.replace(/\s+/g, " ").trim();

        if (!text) {
            throw new Error("Could not extract text from file.");
        }

        return text;
    } catch (error: any) {
        console.error("Resume Parsing Error:", error);
        throw new Error(error.message || "Failed to parse resume content.");
    }
}
