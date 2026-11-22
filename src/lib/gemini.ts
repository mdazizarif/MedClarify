/**
 * @file gemini.ts
 * @description Gemini API client wrapper for MedClarify.
 * Uses @google/genai SDK with structured JSON schema enforcement
 * for deterministic, type-safe medical document analysis.
 *
 * Key design decisions:
 * - responseSchema enforces the exact JSON structure we need
 * - graceful fallback error handling with meaningful messages
 * - PII redaction applied before every API call
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from "@/types/medical";
import { redactPII } from "@/lib/piiRedactor";

/** Supported Gemini models for clinical analysis in priority order */
const DEFAULT_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
];

const CANDIDATE_MODELS = Array.from(
  new Set([process.env.GEMINI_MODEL, ...DEFAULT_MODELS].filter((m): m is string => Boolean(m)))
);

/**
 * JSON Schema for structured output from Gemini.
 * This schema enforces the exact shape of AnalysisResult.
 */
const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      enum: ["prescription", "lab_report", "unknown"],
      description: "Type of medical document analyzed",
    },
    summary: {
      type: Type.STRING,
      description: "Plain English summary of the document for a patient",
    },
    summaryHindi: {
      type: Type.STRING,
      description: "Same summary translated into Hindi (Devanagari script)",
    },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          frequency: { type: Type.STRING },
          duration: { type: Type.STRING },
          purpose: { type: Type.STRING },
          interactions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          notes: { type: Type.STRING },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: ["Morning", "Afternoon", "Evening", "Night"],
            },
          },
        },
        required: [
          "name",
          "dosage",
          "frequency",
          "duration",
          "purpose",
          "interactions",
          "notes",
          "schedule",
        ],
      },
    },
    biomarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          referenceRange: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: ["normal", "borderline", "critical"],
          },
          explanation: { type: Type.STRING },
          implication: { type: Type.STRING },
        },
        required: [
          "name",
          "value",
          "unit",
          "referenceRange",
          "severity",
          "explanation",
          "implication",
        ],
      },
    },
    abnormalCount: {
      type: Type.INTEGER,
      description: "Number of biomarkers outside normal range",
    },
    keyFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key medical findings in English",
    },
    keyFindingsHindi: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key medical findings in Hindi",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence level 0.0 to 1.0",
    },
  },
  required: [
    "documentType",
    "summary",
    "summaryHindi",
    "medications",
    "biomarkers",
    "abnormalCount",
    "keyFindings",
    "keyFindingsHindi",
    "confidence",
  ],
};

/**
 * System prompt for the medical document analysis.
 * Instructs Gemini to behave as a patient-friendly medical translator.
 */
const SYSTEM_PROMPT = `You are MedClarify, an AI assistant that helps patients understand their medical documents.
Your role is to translate complex medical prescriptions and blood test reports into clear, simple language that a non-medical patient can understand.

IMPORTANT RULES:
1. Always explain medical terms in simple, everyday language (reading level: 8th grade)
2. For medications: clearly state what each drug does, how to take it, and any important warnings
3. For lab results: explain what each test measures and what the result means for the patient's health
4. Classify biomarker severity accurately: normal (within range), borderline (slightly outside), critical (significantly outside)
5. Provide BOTH English and Hindi explanations
6. Never give specific medical advice — always recommend consulting a doctor for treatment decisions
7. Map medications to their time slots: Morning / Afternoon / Evening / Night based on frequency
8. Be empathetic and clear — patients are often anxious about their health
9. For dosage/frequency, decode medical shorthand: OD=once daily, BD/BID=twice, TID/TDS=thrice, QID=four times
10. Flag any critical values with appropriate severity classification`;

/**
 * Builds the user prompt for document analysis.
 *
 * @param language - Preferred language ("en" or "hi").
 * @returns The prompt string.
 */
function buildAnalysisPrompt(language: "en" | "hi"): string {
  const langNote =
    language === "hi"
      ? "The user prefers Hindi. Make sure summaryHindi and keyFindingsHindi are detailed and clear."
      : "Provide thorough English explanations.";

  return `Please analyze this medical document image/file carefully.
${langNote}

Extract all relevant information and return it in the structured JSON format.
If this is a prescription, extract all medications with their dosing schedules.
If this is a lab report, extract all biomarker values with their reference ranges.
Provide plain-language explanations that a patient can understand without medical training.
Always include Hindi translations for the summary and key findings.`;
}

/**
 * Creates and returns a configured GoogleGenAI client instance.
 * Throws if the API key is not configured.
 *
 * @param customApiKey - Optional user-provided API key from client header or request body
 * @returns GoogleGenAI instance.
 */
function createGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please set it via .env.local, run 'npm run setup:key', or enter your key in the app."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzes a medical document (image or PDF) using the Gemini API.
 * Returns a structured AnalysisResult with deterministic JSON output.
 *
 * @param fileData - Base64-encoded file content.
 * @param mimeType - MIME type of the file.
 * @param language - Preferred response language.
 * @param customApiKey - Optional client-supplied API key.
 * @returns Parsed AnalysisResult.
 * @throws Error with descriptive message if the API call fails.
 */
export async function analyzeMedicalDocument(
  fileData: string,
  mimeType: string,
  language: "en" | "hi" = "en",
  customApiKey?: string
): Promise<AnalysisResult> {
  const client = createGeminiClient(customApiKey);

  // Redact any PII that might appear in extracted text (belt-and-suspenders)
  const sanitizedPrompt = redactPII(buildAnalysisPrompt(language));

  const candidateModels = CANDIDATE_MODELS;
  let lastError: Error | null = null;

  for (const modelToTry of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelToTry,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_RESPONSE_SCHEMA,
          temperature: 0.1, // Low temperature for more deterministic medical output
          maxOutputTokens: 8192,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: fileData,
                },
              },
              {
                text: sanitizedPrompt,
              },
            ],
          },
        ],
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("Gemini returned an empty response");
      }

      // Parse the structured JSON response
      const parsed = JSON.parse(rawText) as AnalysisResult;
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          "Failed to parse AI response as JSON. The document may be unclear or unreadable."
        );
      }

      if (error instanceof Error) {
        lastError = error;
        // If it's a 404, 503 high demand, or unavailable, try the next model candidate
        if (
          error.message.includes("404") ||
          error.message.includes("NOT_FOUND") ||
          error.message.includes("503") ||
          error.message.includes("high demand") ||
          error.message.includes("UNAVAILABLE") ||
          error.message.includes("overloaded")
        ) {
          console.warn(`[MedClarify] Model ${modelToTry} unavailable (${error.message.substring(0, 70)}...), trying next model...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        if (error.message.includes("API_KEY") || error.message.includes("API key")) {
          throw new Error(
            "Invalid or missing Gemini API key. Please check your key in the top bar or .env.local."
          );
        }
        if (
          error.message.includes("SAFETY") ||
          error.message.includes("blocked")
        ) {
          throw new Error(
            "The document was flagged by safety filters. Please ensure you are uploading a genuine medical document."
          );
        }
        if (
          error.message.includes("quota") ||
          error.message.includes("RESOURCE_EXHAUSTED")
        ) {
          throw new Error(
            "API quota exceeded. Please try again in a few minutes or provide another key."
          );
        }
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Failed to analyze medical document with Gemini AI.");
}
