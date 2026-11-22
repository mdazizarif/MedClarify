import { describe, it, expect } from "vitest";
import {
  classifyBiomarkerSeverity,
  countAbnormalBiomarkers,
  groupMedicationsBySchedule,
  inferScheduleFromFrequency,
  severityToColorClass,
  severityToBgClass,
  severityLabel,
  slotIcon,
} from "@/lib/medicalLogic";
import type { BiomarkerItem, MedicationItem } from "@/types/medical";

// ─── Helper factories ───────────────────────────────────────────────────────

function makeBiomarker(
  overrides: Partial<BiomarkerItem> = {}
): BiomarkerItem {
  return {
    name: "Hemoglobin",
    value: "13.5",
    unit: "g/dL",
    referenceRange: "12.0 – 17.5",
    severity: "normal",
    explanation: "Iron-carrying protein in red blood cells",
    implication: "Normal",
    ...overrides,
  };
}

function makeMedication(
  overrides: Partial<MedicationItem> = {}
): MedicationItem {
  return {
    name: "Paracetamol 500mg",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "5 days",
    purpose: "Pain relief",
    interactions: [],
    notes: "",
    schedule: ["Morning", "Night"],
    ...overrides,
  };
}

// ─── classifyBiomarkerSeverity ──────────────────────────────────────────────

describe("classifyBiomarkerSeverity", () => {
  it("classifies a value within range as normal", () => {
    expect(classifyBiomarkerSeverity("13.5", "12.0 – 17.5", "normal")).toBe(
      "normal"
    );
  });

  it("classifies a slightly low value as borderline", () => {
    // 11.5 is 0.5 below 12.0, range is 5.5, deviation% = 0.5/5.5 ≈ 9% < 15%
    expect(
      classifyBiomarkerSeverity("11.5", "12.0 – 17.5", "normal")
    ).toBe("borderline");
  });

  it("classifies a significantly low value as critical", () => {
    // 5.0 is very far below 12.0 — clearly critical
    expect(classifyBiomarkerSeverity("5.0", "12.0 – 17.5", "normal")).toBe(
      "critical"
    );
  });

  it("classifies a value above range as borderline when slightly high", () => {
    // 18.0 is 0.5 above 17.5, range is 5.5, deviation% ≈ 9% < 15%
    expect(
      classifyBiomarkerSeverity("18.0", "12.0 – 17.5", "normal")
    ).toBe("borderline");
  });

  it("classifies a very high value as critical", () => {
    // 25.0 is way above 17.5
    expect(classifyBiomarkerSeverity("25.0", "12.0 – 17.5", "normal")).toBe(
      "critical"
    );
  });

  it("falls back to aiSeverity when value is not a number", () => {
    expect(
      classifyBiomarkerSeverity("N/A", "12.0 – 17.5", "borderline")
    ).toBe("borderline");
  });

  it("falls back to aiSeverity when range cannot be parsed", () => {
    expect(
      classifyBiomarkerSeverity("5.0", "see note", "critical")
    ).toBe("critical");
  });

  it("handles '> X' format ranges", () => {
    // HDL > 40 — value of 60 is good
    const severity = classifyBiomarkerSeverity("60", "> 40", "normal");
    expect(severity).toBe("normal");
  });

  it("handles '< X' format ranges", () => {
    // Triglycerides < 150 — value of 200 is high
    const severity = classifyBiomarkerSeverity("200", "< 150", "normal");
    expect(["borderline", "critical"]).toContain(severity);
  });

  it("uses dash separator in ranges", () => {
    expect(classifyBiomarkerSeverity("95", "80 - 100", "normal")).toBe(
      "normal"
    );
  });
});

// ─── countAbnormalBiomarkers ────────────────────────────────────────────────

describe("countAbnormalBiomarkers", () => {
  it("returns 0 for all normal biomarkers", () => {
    const biomarkers = [
      makeBiomarker({ severity: "normal" }),
      makeBiomarker({ severity: "normal" }),
    ];
    expect(countAbnormalBiomarkers(biomarkers)).toBe(0);
  });

  it("counts borderline as abnormal", () => {
    const biomarkers = [
      makeBiomarker({ severity: "normal" }),
      makeBiomarker({ severity: "borderline" }),
    ];
    expect(countAbnormalBiomarkers(biomarkers)).toBe(1);
  });

  it("counts critical as abnormal", () => {
    const biomarkers = [
      makeBiomarker({ severity: "critical" }),
      makeBiomarker({ severity: "borderline" }),
    ];
    expect(countAbnormalBiomarkers(biomarkers)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(countAbnormalBiomarkers([])).toBe(0);
  });
});

// ─── groupMedicationsBySchedule ─────────────────────────────────────────────

describe("groupMedicationsBySchedule", () => {
  it("groups medications by Morning slot", () => {
    const meds = [
      makeMedication({ name: "MedA", schedule: ["Morning"] }),
      makeMedication({ name: "MedB", schedule: ["Night"] }),
    ];
    const slots = groupMedicationsBySchedule(meds);
    const morningSlot = slots.find((s) => s.slot === "Morning");
    expect(morningSlot).toBeDefined();
    expect(morningSlot!.medications).toHaveLength(1);
    expect(morningSlot!.medications[0].name).toBe("MedA");
  });

  it("groups medication appearing in multiple slots", () => {
    const meds = [
      makeMedication({ name: "Amoxicillin", schedule: ["Morning", "Afternoon", "Night"] }),
    ];
    const slots = groupMedicationsBySchedule(meds);
    expect(slots).toHaveLength(3);
    slots.forEach((slot) => {
      expect(slot.medications[0].name).toBe("Amoxicillin");
    });
  });

  it("omits slots with no medications", () => {
    const meds = [makeMedication({ schedule: ["Morning"] })];
    const slots = groupMedicationsBySchedule(meds);
    const slotNames = slots.map((s) => s.slot);
    expect(slotNames).not.toContain("Afternoon");
    expect(slotNames).not.toContain("Night");
  });

  it("returns empty array for medications with empty schedule", () => {
    const meds = [makeMedication({ schedule: [] })];
    const slots = groupMedicationsBySchedule(meds);
    expect(slots).toHaveLength(0);
  });

  it("returns slots in Morning → Afternoon → Evening → Night order", () => {
    const meds = [
      makeMedication({ schedule: ["Night", "Morning"] }),
    ];
    const slots = groupMedicationsBySchedule(meds);
    const slotNames = slots.map((s) => s.slot);
    expect(slotNames.indexOf("Morning")).toBeLessThan(
      slotNames.indexOf("Night")
    );
  });

  it("handles empty medication array", () => {
    expect(groupMedicationsBySchedule([])).toHaveLength(0);
  });
});

// ─── inferScheduleFromFrequency ─────────────────────────────────────────────

describe("inferScheduleFromFrequency", () => {
  it("maps 'once daily' to Morning", () => {
    expect(inferScheduleFromFrequency("once daily")).toEqual(["Morning"]);
  });

  it("maps OD to Morning", () => {
    expect(inferScheduleFromFrequency("OD")).toEqual(["Morning"]);
  });

  it("maps 'twice daily' to Morning and Night", () => {
    const slots = inferScheduleFromFrequency("twice daily");
    expect(slots).toContain("Morning");
    expect(slots).toContain("Night");
    expect(slots).toHaveLength(2);
  });

  it("maps BD to Morning and Night", () => {
    const slots = inferScheduleFromFrequency("BD");
    expect(slots).toContain("Morning");
    expect(slots).toContain("Night");
  });

  it("maps TID to Morning, Afternoon, Night", () => {
    const slots = inferScheduleFromFrequency("TID");
    expect(slots).toHaveLength(3);
    expect(slots).toContain("Morning");
    expect(slots).toContain("Afternoon");
    expect(slots).toContain("Night");
  });

  it("maps QID to all four slots", () => {
    const slots = inferScheduleFromFrequency("QID");
    expect(slots).toHaveLength(4);
  });

  it("maps 'three times a day' to 3 slots", () => {
    const slots = inferScheduleFromFrequency("three times a day");
    expect(slots).toHaveLength(3);
  });
});

// ─── Utility functions ───────────────────────────────────────────────────────

describe("severityToColorClass", () => {
  it("returns green class for normal", () => {
    expect(severityToColorClass("normal")).toContain("green");
  });

  it("returns yellow class for borderline", () => {
    expect(severityToColorClass("borderline")).toContain("yellow");
  });

  it("returns red class for critical", () => {
    expect(severityToColorClass("critical")).toContain("red");
  });
});

describe("severityToBgClass", () => {
  it("returns green background for normal", () => {
    expect(severityToBgClass("normal")).toContain("green");
  });

  it("returns yellow background for borderline", () => {
    expect(severityToBgClass("borderline")).toContain("yellow");
  });

  it("returns red background for critical", () => {
    expect(severityToBgClass("critical")).toContain("red");
  });
});

describe("severityLabel", () => {
  it("returns English labels", () => {
    expect(severityLabel("normal", "en")).toBe("Normal");
    expect(severityLabel("borderline", "en")).toBe("Borderline");
    expect(severityLabel("critical", "en")).toBe("Critical");
  });

  it("returns Hindi labels", () => {
    expect(severityLabel("normal", "hi")).toBe("सामान्य");
    expect(severityLabel("borderline", "hi")).toBe("सीमा रेखा");
    expect(severityLabel("critical", "hi")).toBe("गंभीर");
  });
});

describe("slotIcon", () => {
  it("returns sunrise emoji for Morning", () => {
    expect(slotIcon("Morning")).toBe("🌅");
  });

  it("returns sun emoji for Afternoon", () => {
    expect(slotIcon("Afternoon")).toBe("☀️");
  });

  it("returns moon emoji for Night", () => {
    expect(slotIcon("Night")).toBe("🌙");
  });
});
