import { NextRequest, NextResponse } from "next/server";
import { analyzeMedicalDocument } from "@/lib/gemini";
import { redactPII } from "@/lib/piiRedactor";
import type { AnalyzeResponse } from "@/types/medical";

/** Maximum allowed file size: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * POST /api/analyze
 *
 * Secure server-side endpoint that:
 * 1. Validates MIME type and file size
 * 2. Redacts PII from any extracted text context
 * 3. Calls Gemini API via the server-side wrapper
 * 4. Returns structured AnalysisResult JSON
 *
 * Never exposes GEMINI_API_KEY to the client.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // Parse request body
    let body: { fileData?: string; mimeType?: string; language?: string; apiKey?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { fileData, mimeType, language = "en", apiKey } = body;
    const clientApiKey = request.headers.get("x-gemini-api-key") || apiKey;

    // Validate required fields
    if (!fileData || typeof fileData !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required field: fileData (base64 string)" },
        { status: 400 }
      );
    }

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required field: mimeType" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${mimeType}. Allowed types: JPEG, PNG, WebP, PDF`,
        },
        { status: 415 }
      );
    }

    // Validate language
    if (language !== "en" && language !== "hi") {
      return NextResponse.json(
        { success: false, error: "Invalid language. Must be 'en' or 'hi'" },
        { status: 400 }
      );
    }

    // Validate file size (Base64 is ~4/3 of original, so check accordingly)
    const estimatedBytes = Math.ceil((fileData.length * 3) / 4);
    if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (${(estimatedBytes / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 5 MB`,
        },
        { status: 413 }
      );
    }

    // Analyze with Gemini
    const result = await analyzeMedicalDocument(
      fileData,
      mimeType,
      language as "en" | "hi",
      clientApiKey || undefined
    );

    // Post-process: redact any PII that may have been in the OCR'd text
    result.summary = redactPII(result.summary);
    result.summaryHindi = redactPII(result.summaryHindi);
    result.keyFindings = result.keyFindings.map(redactPII);
    result.keyFindingsHindi = result.keyFindingsHindi.map(redactPII);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred";

    console.error("[MedClarify API Error]", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * Disallow non-POST methods
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
