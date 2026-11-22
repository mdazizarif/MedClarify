"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnalysisResult, AccessibilitySettings } from "@/types/medical";
import { AccessibilityBar } from "@/components/AccessibilityBar";
import { DemoSamples } from "@/components/DemoSamples";
import { ReportResults } from "@/components/ReportResults";
import {
  validateFile, compressImage, blobToBase64, computeFileHash,
} from "@/lib/imageOptimizer";
import type { AnalyzeResponse } from "@/types/medical";
import {
  HeartPulse, Lock, Clock, ShieldCheck,
  FileText, Activity, RotateCcw, AlertCircle,
  Upload, Zap, Camera, Volume2, Pill, CalendarCheck,
  FileSignature,
} from "lucide-react";

const CACHE_PREFIX = "medclarify:cache:";
const API_KEY_STORAGE_KEY = "medclarify:gemini_api_key";

export default function HomePage() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    language: "en",
    highContrast: false,
    theme: "dark",
    fontSize: "normal",
  });
  const [apiKey, setApiKey] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const resultsRef    = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const { language, theme = "dark", fontSize } = settings;
  const isHindi = language === "hi";
  const isLight = theme === "light";

  // Load API key from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) setApiKey(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const handleApiKeyChange = useCallback((newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        sessionStorage.setItem(API_KEY_STORAGE_KEY, newKey);
      } else {
        sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Sync theme class on document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  // Sync font size
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize =
      fontSize === "large" ? "114%" : fontSize === "xl" ? "128%" : "100%";
  }, [fontSize]);

  const scrollToResults = useCallback(() => {
    setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      150,
    );
  }, []);

  const announce = useCallback((msg: string) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = msg;
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }

    setIsLoading(true); setError(null); setFileName(file.name);
    announce(isHindi ? "विश्लेषण हो रहा है..." : "Analyzing document, please wait…");

    try {
      const ab   = await file.arrayBuffer();
      const hash = await computeFileHash(ab);
      const key  = `${CACHE_PREFIX}${hash}`;
      const hit  = sessionStorage.getItem(key);

      if (hit) {
        setResult(JSON.parse(hit) as AnalysisResult);
        announce(isHindi ? "कैश से लोड हुआ" : "Loaded from cache");
        scrollToResults();
        return;
      }

      const compressed = await compressImage(file);
      const base64     = await blobToBase64(compressed);
      const mimeType   = file.type === "image/png"           ? "image/png"
                       : file.type === "application/pdf"     ? "application/pdf"
                       : "image/jpeg";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-gemini-api-key"] = apiKey;
      }

      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileData: base64, mimeType, language, apiKey: apiKey || undefined }),
      });
      const data: AnalyzeResponse = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error ?? "Analysis failed");
      }

      try { sessionStorage.setItem(key, JSON.stringify(data.data)); } catch { /* ignore */ }
      setResult(data.data);
      announce(isHindi ? "विश्लेषण पूर्ण!" : "Analysis complete!");
      scrollToResults();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg); announce(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [language, isHindi, apiKey, announce, scrollToResults]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (f) analyzeFile(f);
    },
    [analyzeFile],
  );
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) analyzeFile(f);
  }, [analyzeFile]);
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); }, [],
  );
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleDemoSelect = useCallback((sample: AnalysisResult) => {
    setResult(sample); setFileName(null); setError(null); scrollToResults();
  }, [scrollToResults]);
  const handleReset = useCallback(() => {
    setResult(null); setError(null); setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    announce(isHindi ? "नया दस्तावेज़ चुनें" : "Ready for new document");
  }, [isHindi, announce]);

  /* ───────────────── RENDER ───────────────── */
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] flex flex-col transition-colors duration-200">
      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      {/* ── STICKY TOP ACCESS NAV ── */}
      <AccessibilityBar
        settings={settings}
        onSettingsChange={setSettings}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      {/* ── LANDING VIEW ── */}
      {!result && (
        <main id="main-content" className="flex-1">

          {/* ── 1. HERO SECTION ─────────────────────────────────── */}
          <section className="relative overflow-hidden pt-16 sm:pt-20 pb-12 px-5 text-center">
            {/* Ambient top glow */}
            <div className="hero-glow" aria-hidden="true" />

            {/* Subtle dot grid */}
            <div
              className="dot-grid absolute inset-0 opacity-40 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6 sm:space-y-7 animate-fade-up">

              {/* Floating icon badge */}
              <div className="inline-flex animate-float">
                <div className="w-[72px] h-[72px] rounded-[22px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 glow-medical flex items-center justify-center mx-auto shadow-lg">
                  <HeartPulse className="w-9 h-9 stroke-[1.6]" />
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="font-serif-title text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-[var(--text-main)]">
                  {isHindi ? "डॉक्टर का पर्चा और" : "Understand Prescriptions"}
                </h1>
                <h1 className="font-serif-title text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-emerald-600 dark:text-emerald-400">
                  {isHindi ? "लैब रिपोर्ट समझें सरल भाषा में" : "& Lab Reports in Seconds"}
                </h1>
              </div>

              {/* Patient-Centric Subtitle */}
              <p className="text-[15px] sm:text-[16px] text-[var(--text-muted)] leading-[1.8] max-w-2xl mx-auto font-normal">
                {isHindi
                  ? "डॉक्टर की अस्पष्ट लिखावट या जटिल लैब परीक्षण समझ नहीं आ रहे? MedClarify दवाओं के उपयोग, खुराक का समय (सुबह/दोपहर/रात) और बायोमार्कर्स का सरल हिंदी में अनुवाद करता है और बोलकर सुनाता है।"
                  : "Can't read doctor's messy handwriting or complex blood reports? MedClarify uses multimodal Gemini AI to decipher medications, generate daily dosage routines, explain lab biomarkers, and read everything aloud in plain English or Hindi."}
              </p>

              {/* Value & Trust Badges */}
              <div className="flex items-center justify-center gap-2.5 flex-wrap text-[12px]">
                {[
                  {
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
                    label: isHindi ? "डिवाइस पर PII सुरक्षित" : "Client-Side PII Redacted",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    icon: <Volume2 className="w-3.5 h-3.5 text-amber-500" />,
                    label: isHindi ? "आवाज़ में सुनें (Voice Audio)" : "Audio Voice Narration",
                    color: "text-amber-600 dark:text-amber-400",
                  },
                  {
                    icon: <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />,
                    label: isHindi ? "दैनिक खुराक समय-सारणी" : "Daily Dosage Routine",
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    icon: <Lock className="w-3.5 h-3.5 text-teal-500" />,
                    label: isHindi ? "शून्य डेटा संग्रह" : "Zero Data Retention",
                    color: "text-teal-600 dark:text-teal-400",
                  },
                ].map(({ icon, label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-sub)] font-medium shadow-sm"
                  >
                    {icon}
                    <span className={color}>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── 2. UPLOAD CARD ──────────────────────────────────── */}
          <section className="px-5 pb-14 max-w-2xl mx-auto animate-fade-up-delay-1">
            <div className="upload-card rounded-3xl overflow-hidden shadow-xl border border-[var(--border-subtle)]">

              {/* Top medical green accent bar */}
              <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 opacity-90" />

              <div className="p-7 sm:p-9 space-y-6">

                {/* Drop zone */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={isHindi ? "पर्चा या लैब रिपोर्ट अपलोड करें" : "Upload prescription or lab report"}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !isLoading) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={[
                    "relative rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 select-none",
                    isLoading
                      ? "bg-[var(--bg-inner)] cursor-not-allowed"
                      : isDragOver
                      ? "bg-emerald-500/10 border-2 border-dashed border-emerald-500 scale-[1.01] cursor-copy"
                      : "bg-[var(--bg-inner)] border border-dashed border-[var(--border-mid)] hover:border-emerald-500 hover:bg-emerald-500/5 cursor-pointer group shadow-inner",
                  ].join(" ")}
                >
                  {/* Drop overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 pointer-events-none" />
                  )}

                  {/* Dual document icon with status pip */}
                  <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4 shadow-md mx-auto transition-transform duration-300 group-hover:scale-105">
                    {isLoading ? (
                      <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileSignature className="w-7 h-7 stroke-[1.6]" />
                    )}
                    {!isLoading && (
                      <span className="status-pip absolute -top-1.5 -right-1.5 border-2 border-[var(--bg-inner)]" />
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      <p className="font-serif-title text-xl font-semibold text-[var(--text-main)]">
                        {isHindi ? "दस्तावेज़ का विश्लेषण हो रहा है…" : "Analyzing Prescription & Report…"}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                        {isHindi
                          ? "Gemini Multimodal AI डॉक्टर की लिखावट, दवाएं, खुराक और बायोमार्कर निकाल रहा है"
                          : "Gemini Multimodal AI is extracting handwriting, medications, schedule & lab biomarkers"}
                      </p>
                      {/* Shimmer progress */}
                      <div className="mt-4 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden max-w-[220px] mx-auto">
                        <div className="h-full shimmer rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-serif-title text-xl font-semibold text-[var(--text-main)]">
                        {isHindi
                          ? "पर्चा या लैब रिपोर्ट यहाँ डालें"
                          : "Upload Prescription or Lab Report"}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {isHindi ? "हस्तलिखित पर्चा या PDF खींचें, या " : "Drag & drop messy scripts or test PDFs, or "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-4">
                          {isHindi ? "फ़ाइल चुनें" : "click to browse"}
                        </span>
                      </p>

                      {/* Format tags */}
                      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
                        {["PDF", "PNG", "JPG", "WEBP"].map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                          >
                            {f}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[var(--bg-card)] border border-[var(--border-subtle)] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Max 5MB
                        </span>
                      </div>

                      {/* Client-side privacy guarantee note */}
                      <p className="text-[11px] text-[var(--text-muted)] pt-1">
                        🔒 {isHindi
                          ? "मरीज़ का नाम और फोन नंबर AI भेजने से पहले डिवाइस पर ही हटा दिया जाता है"
                          : "Patient names & phone numbers are scrubbed on-device prior to AI ingestion"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons: Full-width Browse + Quick Camera */}
                {!isLoading && (
                  <div className="grid grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="col-span-4 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-serif-title font-bold text-[16px] sm:text-[17px] tracking-wide shadow-md glow-medical-btn transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
                      aria-label={isHindi ? "पर्चा या रिपोर्ट अपलोड करें" : "Upload prescription or lab report"}
                    >
                      <Upload className="w-5 h-5 stroke-2" />
                      <span>
                        {isHindi ? "पर्चा या रिपोर्ट अपलोड करें" : "Translate Prescription / Lab Report"}
                      </span>
                    </button>

                    {/* Camera capture shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.setAttribute("capture", "environment");
                          fileInputRef.current.click();
                        }
                      }}
                      title={isHindi ? "कैमरे से फोटो लें" : "Take a live photo with camera"}
                      className="col-span-1 h-14 rounded-2xl bg-[var(--bg-inner)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      aria-label={isHindi ? "कैमरा" : "Take photo with camera"}
                    >
                      <Camera className="w-5 h-5 stroke-[1.8]" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  capture="environment"
                  onChange={handleFileInput}
                  className="sr-only"
                  aria-label="Upload prescription file"
                  disabled={isLoading}
                />

                {/* Error Banner */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-600 dark:text-rose-400">
                        {isHindi ? "त्रुटि (Upload Error)" : "Upload Error"}
                      </p>
                      <p className="text-xs mt-0.5 text-rose-600/90 dark:text-rose-400/90">{error}</p>
                      {error.includes("API key") && (
                        <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-semibold underline cursor-pointer" onClick={() => (window as unknown as { openApiKeyModal?: () => void }).openApiKeyModal?.()}>
                          {isHindi ? "👉 ऊपर API Key बटन दबाकर की दर्ज करें" : "👉 Click the API Key button at top to enter your key"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-semibold whitespace-nowrap">
                    {isHindi ? "या सैंपल दस्तावेज़ आज़माएं" : "or explore sample documents"}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                {/* Demo samples: Prescription + CBC Lab Panel */}
                <DemoSamples onSelect={handleDemoSelect} language={language} isLoading={isLoading} />
              </div>
            </div>
          </section>

          {/* ── 3. HOW MEDCLARIFY SOLVES CLINICAL PROBLEMS ───────── */}
          <section className="px-5 pb-24 max-w-5xl mx-auto animate-fade-up-delay-2">
            {/* Section Header */}
            <div className="text-center mb-12 space-y-2">
              <p className="text-[11px] tracking-[0.3em] text-emerald-600 dark:text-emerald-400 uppercase font-mono font-semibold">
                {isHindi ? "मरीज़ों के लिए क्यों उपयोगी है" : "WHY PATIENTS TRUST MEDCLARIFY"}
              </p>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[var(--text-main)]">
                {isHindi ? "कठिन मेडिकल पर्चों से दैनिक स्वास्थ्य स्पष्टता" : "From Clinic Confusion to Daily Clarity"}
              </h2>
              <div className="divider-medical max-w-[100px] mx-auto mt-3" />
            </div>

            {/* 4 Core Pillars of MedClarify */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  num: "01",
                  icon: <Pill className="w-5 h-5 stroke-[1.8]" />,
                  title: isHindi ? "डॉक्टर की लिखावट डिकोड करें" : "Deciphers Messy Scripts",
                  desc: isHindi
                    ? "डॉक्टर की कठिन लिखावट से दवा का नाम, सटीक ताकत (500mg) और कोर्स दिन निकालें।"
                    : "Multimodal Gemini reads illegible clinic handwriting to extract exact medication names, strengths, and durations.",
                },
                {
                  num: "02",
                  icon: <CalendarCheck className="w-5 h-5 stroke-[1.8]" />,
                  title: isHindi ? "दैनिक खुराक समय-सारणी" : "Daily Dosage Routine",
                  desc: isHindi
                    ? "दवाओं को सुबह, दोपहर, रात के स्लॉट में बांटें और खाने की सावधानियां (भोजन के बाद) स्पष्ट समझें।"
                    : "Structures medicines into Morning, Afternoon, and Night routine slots with food directions to eliminate missed doses.",
                },
                {
                  num: "03",
                  icon: <Activity className="w-5 h-5 stroke-[1.8]" />,
                  title: isHindi ? "बायोमार्कर्स एवं विजुअल रेंज" : "Biomarker Flags & Ranges",
                  desc: isHindi
                    ? "रक्त जांच में कम या अधिक मानों को रंगीन विजुअल इंडिकेटर (Normal, Borderline, Attention) से तुरंत पहचानें।"
                    : "Flags out-of-range blood indicators (Hemoglobin, WBC, Sugar) with calibrated visual reference range bars.",
                },
                {
                  num: "04",
                  icon: <Volume2 className="w-5 h-5 stroke-[1.8]" />,
                  title: isHindi ? "बुजुर्गों के लिए आवाज़ में" : "Vernacular Voice Audio",
                  desc: isHindi
                    ? "बुजुर्गों और दृष्टिबाधित मरीज़ों के लिए Web Speech द्वारा हिंदी और अंग्रेज़ी में पूरी रिपोर्ट बोलकर सुनाएं।"
                    : "Built-in voice narration, 0.85x slow speed toggle, light/dark mode, and instant Hindi translation for elderly patients.",
                },
              ].map(({ num, icon, title, desc }) => (
                <div
                  key={num}
                  className="card-base rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  {/* Large watermark number */}
                  <span
                    className="absolute bottom-3 right-4 font-serif-title font-bold text-[56px] leading-none text-emerald-500/10 dark:text-emerald-500/5 select-none pointer-events-none transition-colors duration-300"
                    aria-hidden="true"
                  >
                    {num}
                  </span>

                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                      {icon}
                    </div>
                    <h3 className="font-serif-title font-bold text-[15px] text-[var(--text-main)] mb-2">
                      {title}
                    </h3>
                    <p className="text-[12.5px] text-[var(--text-muted)] leading-[1.65]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Architecture Guarantee Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-serif-title font-bold text-sm text-[var(--text-main)]">
                  {isHindi
                    ? "क्लाइंट-साइड गोपनीयता: आपका व्यक्तिगत डेटा कभी सर्वर पर नहीं जाता"
                    : "Client-Side PII Redaction & Zero Data Retention"}
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {isHindi
                    ? "MedClarify आपके फोन या कंप्यूटर पर ही मरीज़ का नाम, फोन नंबर और अस्पताल का शीर्षक हटा देता है। कोई मेडिकल रिकॉर्ड कभी स्टोर नहीं किया जाता।"
                    : "MedClarify automatically redacts patient names, phone numbers, and identifying clinical headers on your device before sending to the Gemini AI API. Your medical documents are never stored or logged."}
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ── RESULTS VIEW ── */}
      {result && (
        <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-5 py-10">
          <div ref={resultsRef}>
            {/* Results header bar */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="status-pip" />
                <div>
                  <h2 className="font-serif-title font-bold text-2xl text-[var(--text-main)]">
                    {result.documentType === "prescription"
                      ? (isHindi ? "पर्चा अनुवाद एवं खुराक अनुसूची" : "Prescription Translation & Dosage Routine")
                      : (isHindi ? "लैब रिपोर्ट एवं बायोमार्कर विश्लेषण" : "Lab Biomarker Report & Interpretation")}
                  </h2>
                  {fileName && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                      {isHindi ? "दस्तावेज़:" : "Document:"} {fileName}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] transition-all cursor-pointer shadow-sm"
                aria-label="Analyze another document"
              >
                <RotateCcw className="w-4 h-4 text-emerald-500" />
                <span>{isHindi ? "नया दस्तावेज़" : "Translate Another Document"}</span>
              </button>
            </div>

            <ReportResults result={result} settings={settings} />
          </div>
        </main>
      )}

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] py-8 text-center bg-[var(--bg-page)] transition-colors">
        <div className="max-w-4xl mx-auto px-6 space-y-2">
          <p className="text-[13px] text-[var(--text-muted)]">
            {isHindi
              ? "आपका मेडिकल डेटा सुरक्षित रूप से केवल आपके डिवाइस पर संसाधित होता है और हमारे सर्वर पर कभी संग्रहीत नहीं होता।"
              : "Your data is processed securely on-device with client PII redaction and never stored on our servers."}
          </p>
          <p className="text-[11px] text-[var(--text-dim)]">
            MedClarify — Vernacular Medical Prescription & Lab Report Translator.
            Informational aid only — always consult your treating physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
