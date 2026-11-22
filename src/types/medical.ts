/**
 * @file medical.ts
 * @description Core TypeScript interfaces for MedClarify's data model.
 * All types are strictly typed and used across the full-stack application.
 */

/** Supported UI/narration languages */
export type SupportedLanguage = "en" | "hi";

/** Severity classification for biomarker values */
export type BiomarkerSeverity = "normal" | "borderline" | "critical";

/** Time-of-day slots for medication scheduling */
export type DaySlot = "Morning" | "Afternoon" | "Evening" | "Night";

/**
 * A single medication item parsed from the prescription.
 */
export interface MedicationItem {
  /** Name of the medication (generic or brand) */
  name: string;
  /** Dosage strength (e.g. "500mg", "10ml") */
  dosage: string;
  /** Frequency in plain language (e.g. "Twice daily", "Three times a day") */
  frequency: string;
  /** Duration of the course (e.g. "5 days", "1 month") */
  duration: string;
  /** Why this medication is prescribed — in plain patient-friendly language */
  purpose: string;
  /** Key food or drug interactions the patient must know */
  interactions: string[];
  /** Special notes (e.g. "Take with food", "Avoid driving") */
  notes: string;
  /** Mapped day slots for the visual pill schedule */
  schedule: DaySlot[];
}

/**
 * A single blood/lab biomarker result.
 */
export interface BiomarkerItem {
  /** Name of the test (e.g. "Hemoglobin", "Blood Glucose") */
  name: string;
  /** Patient's measured value as a string (e.g. "11.2") */
  value: string;
  /** Unit of measurement (e.g. "g/dL", "mg/dL") */
  unit: string;
  /** Normal reference range as a human-readable string (e.g. "13.5 – 17.5") */
  referenceRange: string;
  /** Severity classification */
  severity: BiomarkerSeverity;
  /** Plain-language explanation of what this test measures */
  explanation: string;
  /** Clinical implication in plain language */
  implication: string;
}

/**
 * A time-slot grouping for the daily medication schedule view.
 */
export interface DailyScheduleSlot {
  slot: DaySlot;
  medications: MedicationItem[];
}

/**
 * The full analysis result returned by the Gemini API and stored in cache.
 */
export interface AnalysisResult {
  /** Type of document analyzed */
  documentType: "prescription" | "lab_report" | "unknown";
  /** Plain-language overall summary */
  summary: string;
  /** Summary translated into Hindi */
  summaryHindi: string;
  /** List of medications extracted (empty for lab reports) */
  medications: MedicationItem[];
  /** List of biomarkers extracted (empty for prescriptions) */
  biomarkers: BiomarkerItem[];
  /** Number of biomarkers outside normal range */
  abnormalCount: number;
  /** Key findings / red flags */
  keyFindings: string[];
  /** Key findings in Hindi */
  keyFindingsHindi: string[];
  /** Confidence level of the analysis (0.0 – 1.0) */
  confidence: number;
}

/**
 * API request payload for /api/analyze.
 */
export interface AnalyzeRequest {
  /** Base64-encoded file content */
  fileData: string;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** Preferred response language */
  language: SupportedLanguage;
}

/**
 * API response envelope from /api/analyze.
 */
export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

/**
 * Accessibility settings managed in the UI.
 */
export interface AccessibilitySettings {
  language: SupportedLanguage;
  highContrast: boolean;
  theme?: "light" | "dark";
  fontSize: "normal" | "large" | "xl";
}
