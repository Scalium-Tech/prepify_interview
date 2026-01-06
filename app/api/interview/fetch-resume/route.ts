import { NextRequest, NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/resume-parser";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        let downloadUrl = url;

        // Handle Google Drive links
        if (url.includes("drive.google.com")) {
            const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
        }

        // Handle Dropbox links
        if (url.includes("dropbox.com")) {
            downloadUrl = url.replace("dl=0", "dl=1");
        }

        console.log("Fetching resume from:", downloadUrl);

        const response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const contentType = response.headers.get("content-type") || "application/pdf"; // Default to PDF if unknown

        // Try to derive filename from headers or URL
        const contentDisposition = response.headers.get("content-disposition");
        let fileName = "resume.pdf";
        if (contentDisposition && contentDisposition.includes("filename=")) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
                fileName = match[1];
            }
        } else {
            // Fallback: name from URL
            const urlParts = url.split("/");
            const potentialName = urlParts[urlParts.length - 1].split("?")[0];
            if (potentialName && (potentialName.endsWith(".pdf") || potentialName.endsWith(".docx"))) {
                fileName = potentialName;
            }
        }

        // Parse content
        const text = await parseResumeFile(buffer, contentType, fileName);

        // Return text AND the file content (base64) so client can create a File object
        // This is crucial to maintain existing flow which expects a File object
        const base64 = buffer.toString("base64");

        return NextResponse.json({
            text,
            fileName,
            mimeType: contentType,
            fileBase64: base64
        });

    } catch (error: any) {
        console.error("Resume Fetch Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch resume from URL" },
            { status: 500 }
        );
    }
}
