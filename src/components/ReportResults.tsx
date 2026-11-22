"use client";

import { useCallback, useState, useEffect } from "react";
import type { AnalysisResult, AccessibilitySettings } from "@/types/medical";
import { groupMedicationsBySchedule, slotIcon } from "@/lib/medicalLogic";
import { speakText, stopSpeaking } from "@/lib/speechSynthesis";
import {
  Volume2, Square, Printer, Copy, Check, Pill, Activity,
  AlertCircle, HelpCircle, ShieldAlert, CheckCircle2,
} from "lucide-react";

interface ReportResultsProps {
  result: AnalysisResult;
  settings: AccessibilitySettings;
}

export function ReportResults({ result, settings }: ReportResultsProps) {
  const { language } = settings;
  const isHindi = language === "hi";

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [copied, setCopied]         = useState(false);

  const summary     = isHindi ? result.summaryHindi : result.summary;
  const keyFindings = isHindi ? result.keyFindingsHindi : result.keyFindings;
  const schedSlots  = groupMedicationsBySchedule(result.medications);

  const totalBio  = result.biomarkers.length;
  const normalCnt = Math.max(0, totalBio - result.abnormalCount);
  const healthPct = totalBio > 0 ? Math.round((normalCnt / totalBio) * 100) : 96;

  // Clean up speech on unmount or language switch
  useEffect(() => {
    return () => {
      stopSpeaking();
      setIsSpeaking(false);
    };
  }, [language]);

  const handleReadAloud = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${isHindi ? "सारांश:" : "Summary:"} ${summary}. ${
      isHindi ? "मुख्य निष्कर्ष:" : "Key Findings:"
    } ${keyFindings.join(". ")}`;

    speakText({
      text: textToSpeak,
      language: isHindi ? "hi" : "en",
      rate: speechRate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (msg) => {
        console.warn("TTS notice:", msg);
        setIsSpeaking(false);
      },
    });
  }, [isSpeaking, summary, keyFindings, isHindi, speechRate]);

  const handleStop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(
      `MedClarify Health Insights\n\n${summary}\n\nKey Findings:\n${keyFindings.map((f) => `• ${f}`).join("\n")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary, keyFindings]);

  const docLabel =
    result.documentType === "prescription"
      ? (isHindi ? "डॉक्टर का पर्चा (Prescription)" : "Doctor's Prescription")
      : result.documentType === "lab_report"
      ? (isHindi ? "रक्त जांच रिपोर्ट (Lab Report)" : "Blood Lab Report")
      : (isHindi ? "चिकित्सा दस्तावेज़" : "Medical Document");

  return (
    <div className="space-y-8 pb-12">

      {/* ── 1. SUMMARY CARD ──────────────────────────────────────── */}
      <section
        aria-labelledby="summary-heading"
        className="card-base rounded-3xl overflow-hidden shadow-lg"
      >
        {/* Top medical green accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 opacity-90" />

        <div className="p-6 sm:p-9 space-y-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {docLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {Math.round(result.confidence * 100)}% AI Confidence
                </span>
              </div>
              <h2 id="summary-heading" className="font-serif-title text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                {isHindi ? "सरल भाषा में सारांश" : "Plain-Language Summary"}
              </h2>
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Listen / Stop (with robust Hindi streaming support) */}
              {!isSpeaking ? (
                <button
                  onClick={handleReadAloud}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md glow-medical-btn transition-all cursor-pointer"
                  aria-label={isHindi ? "आवाज़ में सुनें" : "Listen aloud"}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isHindi ? "सुनें (Speak)" : "Listen"}</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-md"
                  aria-label={isHindi ? "रोकें" : "Stop"}
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>{isHindi ? "रोकें (Stop)" : "Stop"}</span>
                  <span className="flex gap-0.5 items-end h-4 ml-1">
                    <span className="audio-bar" />
                    <span className="audio-bar" />
                    <span className="audio-bar" />
                  </span>
                </button>
              )}

              {/* Speed toggle */}
              <div className="flex bg-[var(--bg-inner)] border border-[var(--border-subtle)] rounded-lg p-0.5 text-[11px]">
                {[0.85, 1.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSpeechRate(r)}
                    className={`px-2.5 py-1 rounded-md font-mono transition-all cursor-pointer ${
                      speechRate === r
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>

              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-[var(--bg-inner)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all cursor-pointer"
                aria-label="Copy summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isHindi ? "कॉपी हुआ!" : "Copied!") : (isHindi ? "कॉपी" : "Copy")}</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium bg-[var(--bg-inner)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all cursor-pointer"
                aria-label="Print report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isHindi ? "प्रिंट" : "Print"}</span>
              </button>
            </div>
          </div>

          {/* Summary text */}
          <div className="bg-[var(--bg-inner)] rounded-2xl border border-[var(--border-subtle)] p-6 text-[15px] leading-[1.85] text-[var(--text-sub)]">
            {summary}
          </div>

          {/* Key findings */}
          {keyFindings.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.2em] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {isHindi ? "मुख्य निष्कर्ष" : "KEY CLINICAL FINDINGS"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keyFindings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)] text-sm text-[var(--text-sub)]"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. MEDICATIONS SECTION ───────────────────────────────── */}
      {result.medications.length > 0 && (
        <section aria-labelledby="meds-heading" className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Pill className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 id="meds-heading" className="font-serif-title text-xl font-bold text-[var(--text-main)]">
                {isHindi ? "दवाइयां और खुराक अनुसूची" : "Prescribed Medications & Daily Schedule"}
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {result.medications.length}{" "}
                {isHindi
                  ? "दवाएं पहचानी गईं — सुबह, दोपहर, रात के अनुसार व्यवस्थित"
                  : "medicines decoded — review dosage times & food directions"}
              </p>
            </div>
          </div>

          {/* Morning / Afternoon / Night slots */}
          {schedSlots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {schedSlots
                .filter((s) => ["Morning", "Afternoon", "Evening", "Night"].includes(s.slot))
                .map(({ slot, medications: meds }) => {
                  const meta: Record<string, { hi: string; note: string; icon: string }> = {
                    Morning:   { hi: "सुबह (Morning)",     note: "With / after breakfast", icon: "🌅" },
                    Afternoon: { hi: "दोपहर (Afternoon)", note: "With / after lunch",     icon: "☀️" },
                    Evening:   { hi: "शाम (Evening)",     note: "At tea time",            icon: "🌇" },
                    Night:     { hi: "रात (Night)",       note: "Before dinner / bed",    icon: "🌙" },
                  };
                  const m = meta[slot] ?? { hi: slot, note: "As directed", icon: "💊" };
                  return (
                    <div key={slot} className="card-base rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <p className="font-serif-title font-bold text-[15px] text-[var(--text-main)]">
                            {isHindi ? m.hi : slot}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">{m.note}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {meds.length} MED{meds.length > 1 ? "S" : ""}
                        </span>
                      </div>
                      <ul className="space-y-2" role="list">
                        {meds.map((med, i) => (
                          <li
                            key={i}
                            className="p-3 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)] text-sm"
                          >
                            <div className="flex items-center justify-between font-semibold text-[var(--text-main)]">
                              <span>{med.name}</span>
                              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {med.dosage}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1">{med.purpose}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Detailed Medication Cards */}
          <div className="space-y-4">
            {result.medications.map((med, i) => (
              <div key={i} className="card-base rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif-title font-bold text-lg text-[var(--text-main)]">
                          {med.name}
                        </h3>
                        <span className="font-mono text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          {med.dosage}
                        </span>
                      </div>
                      <p className="text-[12px] font-mono text-[var(--text-muted)] mt-0.5">
                        {med.duration} &bull; {med.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {med.schedule.map((slot) => (
                      <span
                        key={slot}
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--bg-inner)] border border-[var(--border-subtle)] text-[var(--text-sub)] px-2.5 py-1 rounded-lg"
                      >
                        <span>{slotIcon(slot)}</span> {slot}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[var(--text-sub)] leading-relaxed">
                  <span className="font-semibold text-[var(--text-main)]">
                    {isHindi ? "उपयोग: " : "Purpose: "}
                  </span>
                  {med.purpose}
                </p>

                {med.interactions.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {isHindi ? "सावधानियां एवं निर्देश:" : "Precautions & Food Guidelines:"}
                    </p>
                    <ul className="space-y-1.5 text-[12px] text-[var(--text-sub)]">
                      {med.interactions.map((w, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. BIOMARKERS SECTION ────────────────────────────────── */}
      {result.biomarkers.length > 0 && (
        <section aria-labelledby="bio-heading" className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Activity className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h2 id="bio-heading" className="font-serif-title text-xl font-bold text-[var(--text-main)]">
                  {isHindi ? "रक्त जांच बायोमार्कर्स" : "Lab Biomarker Results"}
                </h2>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  {isHindi
                    ? "मानक क्लिनिकल संदर्भ सीमाओं के आधार पर विश्लेषित"
                    : "Calibrated against standard clinical reference intervals"}
                </p>
              </div>
            </div>

            {result.abnormalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                {result.abnormalCount} {isHindi ? "मान असामान्य" : "values flagged"}
              </span>
            )}
          </div>

          {/* Health index strip */}
          <div className="card-base rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isHindi ? "समग्र स्वास्थ्य सूचकांक" : "OVERALL HEALTH INDEX"}
              </p>
              <span className="font-serif-title font-bold text-2xl text-[var(--text-main)]">
                {healthPct}%
              </span>
            </div>
            <div className="h-2.5 bg-[var(--bg-inner)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${healthPct}%`,
                  background:
                    healthPct >= 80 ? "#10b981" : healthPct >= 50 ? "#fbbf24" : "#f87171",
                }}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              {normalCnt} of {totalBio} biomarkers within normal clinical range
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.biomarkers.map((b, i) => {
              const isNorm = b.severity === "normal";
              const isBord = b.severity === "borderline";
              const badge = isNorm
                ? { label: "Normal",           cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
                : isBord
                ? { label: "Borderline",       cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
                :   { label: "Attention Needed", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };

              const barCls = isNorm ? "bg-emerald-500" : isBord ? "bg-amber-500" : "bg-rose-500";
              const barW   = isNorm ? "60%" : isBord ? "82%" : "100%";

              return (
                <div
                  key={i}
                  className="card-base rounded-2xl p-6 space-y-4"
                  role={!isNorm ? "alert" : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif-title font-bold text-lg text-[var(--text-main)]">
                      {b.name}
                    </h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-[var(--text-main)]">
                      {b.value}
                    </span>
                    <span className="text-sm font-mono text-[var(--text-muted)]">{b.unit}</span>
                  </div>

                  {/* Range bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mb-1.5">
                      <span>{isHindi ? "सामान्य सीमा:" : "Ref Range:"}</span>
                      <span className="text-[var(--text-main)] font-semibold">{b.referenceRange}</span>
                    </div>
                    <div className="h-2.5 bg-[var(--bg-inner)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barCls}`}
                        style={{ width: barW }}
                      />
                    </div>
                  </div>

                  <p className="text-[13px] text-[var(--text-sub)] leading-relaxed">{b.explanation}</p>

                  {!isNorm && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-[12px] text-[var(--text-sub)]">
                      <span className="text-amber-500 mt-0.5">👉</span>
                      <span>{b.implication}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. DOCTOR QUESTIONS ──────────────────────────────────── */}
      <section aria-labelledby="dr-heading" className="card-base rounded-3xl p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h3 id="dr-heading" className="font-serif-title text-lg font-bold text-[var(--text-main)]">
              {isHindi ? "डॉक्टर से यह प्रश्न पूछें" : "Questions to Ask Your Doctor"}
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {isHindi ? "अपनी अगली क्लिनिक मुलाकात में इनसे मदद लें" : "Bring these questions to your next consultation"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-medium text-[var(--text-sub)]">
          {result.documentType === "prescription" ? (
            <>
              <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1.5 font-bold">01</span>
                {isHindi
                  ? "क्या 5 दिन बाद भी दवाएं जारी रखनी हैं या पूरा कोर्स होने पर बंद करें?"
                  : "Should I complete the full course or stop if symptoms improve earlier?"}
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1.5 font-bold">02</span>
                {isHindi
                  ? "यदि एक खुराक भूल जाऊं तो क्या तुरंत लेनी चाहिए?"
                  : "What should I do if I accidentally miss a scheduled dose?"}
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1.5 font-bold">01</span>
                {isHindi
                  ? "असामान्य बायोमार्कर के लिए क्या खान-पान या सप्लीमेंट लेना चाहिए?"
                  : "For borderline markers, do you recommend dietary changes or specific supplements?"}
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1.5 font-bold">02</span>
                {isHindi
                  ? "यह रक्त परीक्षण दोबारा कब दोहराना चाहिए?"
                  : "When should this blood test be repeated to monitor progress?"}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 5. DISCLAIMER ────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inner)] text-[12px] text-[var(--text-muted)] leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p>
          {isHindi
            ? "चिकित्सीय अस्वीकरण: MedClarify केवल एक सूचनात्मक अनुवाद सहायता है। यह पेशेवर डॉक्टर की सलाह, निदान या उपचार का विकल्प नहीं है। दवाएं बदलने से पहले हमेशा अपने डॉक्टर से परामर्श करें।"
            : "Medical Disclaimer: MedClarify is an informational translation aid only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed physician before changing any medication or health routine."}
        </p>
      </div>
    </div>
  );
}
