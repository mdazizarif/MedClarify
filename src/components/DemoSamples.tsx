"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types/medical";
import { Pill, Activity, ArrowRight, Sparkles } from "lucide-react";

/* ── Sample 1: Handwritten Prescription ──────────────────────────────── */
export const SAMPLE_PRESCRIPTION: AnalysisResult = {
  documentType: "prescription",
  summary: "This prescription treats a bacterial respiratory chest infection. You have been prescribed 3 medications: an antibiotic (Amoxicillin) to eliminate the bacteria, a cough syrup to clear throat congestion, and paracetamol for fever and pain relief. It is vital to complete the full 5-day antibiotic course even if you feel better earlier to prevent antibiotic resistance.",
  summaryHindi: "यह नुस्खा छाती के बैक्टीरियल संक्रमण के इलाज के लिए है। 3 दवाएं दी गई हैं: Amoxicillin (एंटीबायोटिक - संक्रमण खत्म करने हेतु), कफ सिरप (खांसी एवं कफ में आराम के लिए), और पेरासिटामोल (बुखार एवं दर्द के लिए)। पूरे 5 दिन का एंटीबायोटिक कोर्स अवश्य पूरा करें।",
  medications: [
    {
      name: "Amoxicillin 500mg",
      dosage: "500mg",
      frequency: "Three times daily (TDS)",
      duration: "5 days",
      purpose: "Antibiotic that clears the bacterial chest infection.",
      interactions: ["Avoid alcohol", "Take with food to prevent stomach upset", "Do not skip doses"],
      notes: "Complete the full 5-day course.",
      schedule: ["Morning", "Afternoon", "Night"],
    },
    {
      name: "Benadryl Cough Syrup",
      dosage: "10ml",
      frequency: "Three times daily after meals",
      duration: "5 days",
      purpose: "Suppresses stubborn cough and thins chest congestion.",
      interactions: ["May cause mild drowsiness — avoid driving", "Do not combine with other sedatives"],
      notes: "Shake bottle well before pouring.",
      schedule: ["Morning", "Afternoon", "Night"],
    },
    {
      name: "Paracetamol 650mg",
      dosage: "650mg",
      frequency: "Twice daily as needed (SOS)",
      duration: "5 days",
      purpose: "Lowers body fever and eases muscular pain.",
      interactions: ["Do not exceed 4 tablets in 24 hours", "Avoid alcohol to protect liver"],
      notes: "Take only when experiencing fever or discomfort.",
      schedule: ["Morning", "Night"],
    },
  ],
  biomarkers: [],
  abnormalCount: 0,
  keyFindings: [
    "Bacterial respiratory tract infection diagnosed",
    "5-day antibiotic regimen (Amoxicillin) — mandatory to finish full course",
    "Cough syrup may cause mild drowsiness — take ample rest",
    "Drink warm water; consult doctor if fever persists past 3 days",
  ],
  keyFindingsHindi: [
    "छाती के बैक्टीरियल संक्रमण का निदान",
    "5 दिन का एंटीबायोटिक (Amoxicillin) कोर्स - पूरा करना अनिवार्य है",
    "कफ सिरप से हल्की नींद आ सकती है - पर्याप्त आराम करें",
    "गुनगुना पानी पिएं; यदि बुखार 3 दिन बाद भी रहे तो डॉक्टर से संपर्क करें",
  ],
  confidence: 0.96,
};

/* ── Sample 2: Complete Blood Count (CBC) Lab Report ────────────────── */
export const SAMPLE_CBC_REPORT: AnalysisResult = {
  documentType: "lab_report",
  summary: "Your CBC blood report indicates that most vital values are within healthy limits. However, your Hemoglobin is mildly reduced at 10.8 g/dL (normal reference range: 12.0–17.5 g/dL), which suggests mild iron-deficiency anemia. White blood cells and platelets are normal. Discuss dietary iron rich foods with your physician.",
  summaryHindi: "आपकी CBC रक्त रिपोर्ट में अधिकांश मान सामान्य हैं। हालांकि, हीमोग्लोबिन 10.8 g/dL है (सामान्य सीमा: 12.0–17.5 g/dL) जो हल्के एनीमिया का संकेत है। श्वेत रक्त कोशिकाएं (WBC) और प्लेटलेट्स बिल्कुल सामान्य हैं।",
  medications: [],
  biomarkers: [
    {
      name: "Hemoglobin (Hb)",
      value: "10.8",
      unit: "g/dL",
      referenceRange: "12.0 – 17.5",
      severity: "borderline",
      explanation: "Hemoglobin is the vital protein in red blood cells that carries oxygen throughout your body.",
      implication: "Mildly low — suggests mild iron deficiency anemia. You might experience slight fatigue or tiredness after exertion.",
    },
    {
      name: "Total RBC Count",
      value: "4.1",
      unit: "million/μL",
      referenceRange: "4.0 – 6.2",
      severity: "normal",
      explanation: "Red blood cells transport oxygen from your lungs to tissues across the body.",
      implication: "Normal count — oxygen transport capacity is stable.",
    },
    {
      name: "Total WBC Count",
      value: "7.2",
      unit: "10³/μL",
      referenceRange: "4.5 – 11.0",
      severity: "normal",
      explanation: "White blood cells defend your body against bacterial and viral infections.",
      implication: "Healthy immune defense levels — no active systemic infection.",
    },
    {
      name: "Platelet Count",
      value: "250",
      unit: "10³/μL",
      referenceRange: "150 – 450",
      severity: "normal",
      explanation: "Platelets enable healthy blood clotting whenever an injury or cut occurs.",
      implication: "Normal clotting ability — low risk of abnormal bleeding.",
    },
  ],
  abnormalCount: 1,
  keyFindings: [
    "Overall blood profile is mostly healthy",
    "Hemoglobin mildly reduced at 10.8 g/dL — indicates mild anemia",
    "Immune cell count (WBC: 7.2) and Platelets (250) are fully normal",
    "Incorporate iron-rich foods (spinach, lentils, beets) — review with doctor",
  ],
  keyFindingsHindi: [
    "समग्र रक्त प्रोफ़ाइल काफी हद तक स्वस्थ है",
    "हीमोग्लोबिन हल्का कम (10.8 g/dL) - हल्के एनीमिया का संकेत",
    "प्रतिरक्षा कोशिकाएं (WBC) और प्लेटलेट्स पूर्णतया सामान्य सीमा में हैं",
    "आयरन युक्त आहार (पालक, दालें, चुकंदर) लें और डॉक्टर से परामर्श करें",
  ],
  confidence: 0.98,
};

/* ── Component ─────────────────────────────────────────────────────────── */
interface DemoSamplesProps {
  onSelect: (sample: AnalysisResult) => void;
  language: "en" | "hi";
  isLoading?: boolean;
}

export function DemoSamples({ onSelect, language, isLoading = false }: DemoSamplesProps) {
  const [active, setActive] = useState<"prescription" | "cbc" | null>(null);
  const isHindi = language === "hi";

  const pick = (s: AnalysisResult, t: "prescription" | "cbc") => {
    setActive(t);
    onSelect(s);
  };

  const cards = [
    {
      id: "prescription" as const,
      sample: SAMPLE_PRESCRIPTION,
      icon: <Pill className="w-5 h-5 stroke-[1.5]" />,
      num: "01",
      badge: isHindi ? "हस्तलिखित पर्चा" : "Doctor's Prescription",
      title: isHindi ? "डॉक्टर का पर्चा (Handwritten Rx)" : "Doctor's Handwritten Prescription",
      desc: isHindi
        ? "कठिन लिखावट से एंटीबायोटिक, खुराक समय (सुबह/दोपहर/रात) और खाने की सावधानियां निकालें।"
        : "Decodes antibiotics, TDS frequency, dosage slots (Morning/Noon/Night), and food warnings.",
      cta: isHindi ? "पर्चा सैंपल देखें" : "Try Prescription Sample",
    },
    {
      id: "cbc" as const,
      sample: SAMPLE_CBC_REPORT,
      icon: <Activity className="w-5 h-5 stroke-[1.5]" />,
      num: "02",
      badge: isHindi ? "लैब रक्त जांच" : "Lab Blood Panel",
      title: isHindi ? "CBC रक्त जांच रिपोर्ट (Lab Panel)" : "Complete Blood Count (CBC Panel)",
      desc: isHindi
        ? "कम हीमोग्लोबिन, श्वेत रक्त कोशिकाएं (WBC) और प्लेटलेट्स के रंगीन विजुअल इंडिकेटर समझें।"
        : "Flags borderline Hemoglobin (mild anemia) with visual range bars alongside normal WBC & Platelet counts.",
      cta: isHindi ? "लैब सैंपल देखें" : "Try Lab Report Sample",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map(({ id, sample, icon, num, badge, title, desc, cta }) => (
        <button
          key={id}
          onClick={() => pick(sample, id)}
          disabled={isLoading}
          aria-label={`Try sample: ${title}`}
          className={[
            "group text-left p-5 rounded-2xl bg-[var(--bg-inner)] border transition-all duration-200 cursor-pointer relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
            active === id
              ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40"
              : "border-[var(--border-subtle)] hover:border-emerald-500/50 hover:shadow-md",
          ].join(" ")}
        >
          {/* Watermark number */}
          <span
            className="absolute -bottom-2 -right-1 font-serif-title font-bold text-[52px] leading-none text-emerald-500/10 dark:text-emerald-500/5 select-none pointer-events-none group-hover:text-emerald-500/20 transition-colors"
            aria-hidden="true"
          >
            {num}
          </span>

          <div className="relative z-10 flex items-start gap-3.5">
            <div
              className={[
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                active === id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
              ].join(" ")}
            >
              {icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  {badge}
                </span>
              </div>
              <h4 className="font-serif-title font-bold text-[14px] text-[var(--text-main)] leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {title}
              </h4>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {desc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>{cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
