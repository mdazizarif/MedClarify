/**
 * @file medicalLogic.ts
 * @description Deterministic helper functions for medical data processing.
 * These are pure functions with no side effects — fully unit-testable.
 *
 * Covers:
 * - Biomarker severity classification (normal / borderline / critical)
 * - Abnormal biomarker counting
 * - Medication schedule grouping by time-of-day slot
 */

import type {
  BiomarkerItem,
  BiomarkerSeverity,
  DailyScheduleSlot,
  DaySlot,
  MedicationItem,
} from "@/types/medical";

/**
 * Known reference ranges for common biomarkers.
 * Values are [min, max] in the standard unit for that test.
 * This is a fallback for the AI — the AI provides its own ranges per result.
 */
export const KNOWN_REFERENCE_RANGES: Record<
  string,
  { min: number; max: number; unit: string }
> = {
  Hemoglobin: { min: 12.0, max: 17.5, unit: "g/dL" },
  Hematocrit: { min: 36.0, max: 50.0, unit: "%" },
  RBC: { min: 4.0, max: 6.2, unit: "million/μL" },
  WBC: { min: 4000, max: 11000, unit: "cells/μL" },
  Platelets: { min: 150000, max: 400000, unit: "/μL" },
  Glucose: { min: 70, max: 99, unit: "mg/dL" },
  "Blood Glucose (Fasting)": { min: 70, max: 100, unit: "mg/dL" },
  Creatinine: { min: 0.6, max: 1.2, unit: "mg/dL" },
  Urea: { min: 10, max: 50, unit: "mg/dL" },
  Sodium: { min: 136, max: 145, unit: "mEq/L" },
  Potassium: { min: 3.5, max: 5.0, unit: "mEq/L" },
  Cholesterol: { min: 0, max: 200, unit: "mg/dL" },
  "LDL Cholesterol": { min: 0, max: 100, unit: "mg/dL" },
  "HDL Cholesterol": { min: 40, max: 999, unit: "mg/dL" },
  Triglycerides: { min: 0, max: 150, unit: "mg/dL" },
  TSH: { min: 0.4, max: 4.0, unit: "mIU/L" },
  Calcium: { min: 8.5, max: 10.5, unit: "mg/dL" },
};

/**
 * Borderline thresholds — a value within this percentage outside the reference
 * range is classified as "borderline" rather than "critical".
 */
const BORDERLINE_THRESHOLD_PERCENT = 0.15; // 15% outside range

/**
 * Classifies a biomarker severity from its numeric value and reference range string.
 * Falls back to the AI-provided severity if parsing fails.
 *
 * @param value - The measured value as a string (e.g. "11.2").
 * @param referenceRange - Human-readable range (e.g. "13.5 – 17.5" or "> 40").
 * @param aiSeverity - The severity already determined by the AI model.
 * @returns The final severity classification.
 *
 * @example
 * ```ts
 * classifyBiomarkerSeverity("11.2", "13.5 – 17.5", "normal"); // → "borderline"
 * classifyBiomarkerSeverity("5.0", "13.5 – 17.5", "normal");  // → "critical"
 * ```
 */
export function classifyBiomarkerSeverity(
  value: string,
  referenceRange: string,
  aiSeverity: BiomarkerSeverity
): BiomarkerSeverity {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return aiSeverity;

  // Try to parse range: "X – Y", "X - Y", "X to Y"
  const rangeMatch = referenceRange.match(
    /(\d+\.?\d*)\s*[-–to]+\s*(\d+\.?\d*)/i
  );
  if (!rangeMatch) {
    // Try "> X" or "< X" formats
    const gtMatch = referenceRange.match(/>\s*(\d+\.?\d*)/);
    const ltMatch = referenceRange.match(/<\s*(\d+\.?\d*)/);
    if (gtMatch) {
      const min = parseFloat(gtMatch[1]);
      if (numericValue <= min * 0.7) return "critical";
      if (numericValue <= min) return "borderline";
      return "normal";
    }
    if (ltMatch) {
      const max = parseFloat(ltMatch[1]);
      if (numericValue >= max * 1.3) return "critical";
      if (numericValue >= max) return "borderline";
      return "normal";
    }
    return aiSeverity;
  }

  const min = parseFloat(rangeMatch[1]);
  const max = parseFloat(rangeMatch[2]);
  const range = max - min;

  if (numericValue >= min && numericValue <= max) return "normal";

  const deviation = Math.min(
    Math.abs(numericValue - min),
    Math.abs(numericValue - max)
  );
  const deviationPercent = range > 0 ? deviation / range : deviation;

  if (deviationPercent <= BORDERLINE_THRESHOLD_PERCENT) return "borderline";
  return "critical";
}

/**
 * Counts the number of biomarkers that are not "normal".
 *
 * @param biomarkers - Array of BiomarkerItem results.
 * @returns Count of abnormal (borderline + critical) biomarkers.
 */
export function countAbnormalBiomarkers(biomarkers: BiomarkerItem[]): number {
  return biomarkers.filter((b) => b.severity !== "normal").length;
}

/**
 * Returns a Tailwind CSS color class for a given severity level.
 *
 * @param severity - The biomarker severity.
 * @returns Tailwind class string for text color.
 */
export function severityToColorClass(severity: BiomarkerSeverity): string {
  switch (severity) {
    case "normal":
      return "text-green-600 dark:text-green-400";
    case "borderline":
      return "text-yellow-600 dark:text-yellow-400";
    case "critical":
      return "text-red-600 dark:text-red-400";
  }
}

/**
 * Returns a Tailwind CSS background color class for a severity badge.
 *
 * @param severity - The biomarker severity.
 * @returns Tailwind class string for background color.
 */
export function severityToBgClass(severity: BiomarkerSeverity): string {
  switch (severity) {
    case "normal":
      return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
    case "borderline":
      return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
    case "critical":
      return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
  }
}

/**
 * Returns a human-readable label for a severity level.
 *
 * @param severity - The biomarker severity.
 * @param language - "en" or "hi".
 * @returns Display label string.
 */
export function severityLabel(
  severity: BiomarkerSeverity,
  language: "en" | "hi" = "en"
): string {
  if (language === "hi") {
    switch (severity) {
      case "normal":
        return "सामान्य";
      case "borderline":
        return "सीमा रेखा";
      case "critical":
        return "गंभीर";
    }
  }
  switch (severity) {
    case "normal":
      return "Normal";
    case "borderline":
      return "Borderline";
    case "critical":
      return "Critical";
  }
}

/** All possible day slots in display order */
const DAY_SLOT_ORDER: DaySlot[] = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

/**
 * Groups medications by their time-of-day schedule slots.
 * Medications with no schedule are listed under all slots they appear in,
 * or omitted if their schedule array is empty.
 *
 * @param medications - Array of MedicationItem.
 * @returns Array of DailyScheduleSlot, one per time slot that has medications.
 *
 * @example
 * ```ts
 * const slots = groupMedicationsBySchedule(meds);
 * // → [{ slot: "Morning", medications: [...] }, { slot: "Night", medications: [...] }]
 * ```
 */
export function groupMedicationsBySchedule(
  medications: MedicationItem[]
): DailyScheduleSlot[] {
  const slotMap: Map<DaySlot, MedicationItem[]> = new Map(
    DAY_SLOT_ORDER.map((slot) => [slot, []])
  );

  for (const med of medications) {
    if (!med.schedule || med.schedule.length === 0) continue;
    for (const slot of med.schedule) {
      if (DAY_SLOT_ORDER.includes(slot)) {
        slotMap.get(slot)!.push(med);
      }
    }
  }

  return DAY_SLOT_ORDER.filter((slot) => slotMap.get(slot)!.length > 0).map(
    (slot) => ({ slot, medications: slotMap.get(slot)! })
  );
}

/**
 * Returns an emoji icon for a day slot.
 *
 * @param slot - The time-of-day slot.
 * @returns An emoji string.
 */
export function slotIcon(slot: DaySlot): string {
  switch (slot) {
    case "Morning":
      return "🌅";
    case "Afternoon":
      return "☀️";
    case "Evening":
      return "🌇";
    case "Night":
      return "🌙";
  }
}

/**
 * Infers medication schedule slots from a frequency string.
 * Used as a fallback when the AI doesn't provide explicit slot data.
 *
 * @param frequency - Frequency description (e.g. "Twice daily", "Three times a day").
 * @returns Array of DaySlot values.
 */
export function inferScheduleFromFrequency(frequency: string): DaySlot[] {
  const f = frequency.toLowerCase();

  if (f.includes("once") || f.includes("1 time") || f.includes("od")) {
    return ["Morning"];
  }
  if (f.includes("twice") || f.includes("2 time") || f.includes("bd") || f.includes("bid")) {
    return ["Morning", "Night"];
  }
  if (
    f.includes("three") ||
    f.includes("3 time") ||
    f.includes("tid") ||
    f.includes("tds")
  ) {
    return ["Morning", "Afternoon", "Night"];
  }
  if (
    f.includes("four") ||
    f.includes("4 time") ||
    f.includes("qid") ||
    f.includes("qds")
  ) {
    return ["Morning", "Afternoon", "Evening", "Night"];
  }
  if (f.includes("morning")) return ["Morning"];
  if (f.includes("night") || f.includes("bedtime")) return ["Night"];
  if (f.includes("afternoon")) return ["Afternoon"];
  if (f.includes("evening")) return ["Evening"];

  return ["Morning"];
}
