"use client";

import { useCallback, useState } from "react";
import type { AccessibilitySettings } from "@/types/medical";
import { Sun, Moon, Languages, HeartPulse, ShieldCheck, KeyRound } from "lucide-react";
import { ApiKeyModal } from "@/components/ApiKeyModal";

interface AccessibilityBarProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

export function AccessibilityBar({
  settings,
  onSettingsChange,
  apiKey = "",
  onApiKeyChange,
}: AccessibilityBarProps) {
  const { language, theme = "dark", fontSize } = settings;
  const isHindi = language === "hi";
  const isLight = theme === "light";

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    const nextTheme = isLight ? "dark" : "light";
    onSettingsChange({
      ...settings,
      theme: nextTheme,
      highContrast: nextTheme === "light", // for backwards-compatibility
    });
  }, [settings, isLight, onSettingsChange]);

  const setFontSize = useCallback(
    (size: AccessibilitySettings["fontSize"]) => {
      onSettingsChange({ ...settings, fontSize: size });
    },
    [settings, onSettingsChange],
  );

  const toggleLanguage = useCallback(() => {
    onSettingsChange({ ...settings, language: language === "en" ? "hi" : "en" });
  }, [settings, language, onSettingsChange]);

  const fontSizeOptions: Array<{
    value: AccessibilitySettings["fontSize"];
    label: string;
    title: string;
  }> = [
    { value: "normal", label: "A",   title: isHindi ? "सामान्य फ़ॉन्ट" : "Normal text" },
    { value: "large",  label: "A+",  title: isHindi ? "बड़ा फ़ॉन्ट"    : "Large text" },
    { value: "xl",     label: "A++", title: isHindi ? "विशाल फ़ॉन्ट"  : "Extra large text" },
  ];

  return (
    <>
      <nav
        aria-label="Main application bar"
        className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-page)]/90 backdrop-blur-xl transition-colors duration-200"
      >
        {/* Top medical shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[66px] flex items-center justify-between gap-3">

          {/* ── Brand ── */}
          <a
            href="/"
            className="flex items-center gap-3 shrink-0 group"
            aria-label="MedClarify — Home"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.22)] group-hover:shadow-[0_0_22px_rgba(16,185,129,0.4)] transition-all">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-serif-title font-bold text-[18px] text-[var(--text-main)] tracking-wide block">
                MedClarify
              </span>
              <span className="text-[9px] tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">
                {isHindi ? "पर्चा एवं लैब अनुवादक" : "PRESCRIPTION & LAB TRANSLATOR"}
              </span>
            </div>
          </a>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2" role="group" aria-label="Display and access controls">

            {/* Privacy Badge — desktop only */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isHindi ? "PII सुरक्षित • शून्य डेटा संग्रह" : "Client PII-Redacted • Zero Storage"}</span>
            </div>

            {/* API Key Configuration Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="h-8 px-2.5 sm:px-3 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
              title={isHindi ? "API Key कॉन्फ़िगर करें" : "Configure Gemini API Key"}
              aria-label={isHindi ? "API Key कॉन्फ़िगर करें" : "Configure Gemini API Key"}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">
                {apiKey ? (isHindi ? "API Key: सक्रिय" : "API Key: Set") : "API Key"}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${apiKey ? "bg-emerald-500" : "bg-amber-400"}`}
              />
            </button>

            {/* Font-size stepper for accessibility */}
            <div
              className="flex items-center bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] p-0.5 gap-0.5 shadow-sm"
              role="group"
              aria-label={isHindi ? "फ़ॉन्ट आकार" : "Font size"}
            >
              {fontSizeOptions.map(({ value, label, title }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  aria-pressed={fontSize === value}
                  aria-label={title}
                  className={[
                    "min-w-[28px] h-7 px-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                    fontSize === value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isLight
                ? (isHindi ? "डार्क मोड चालू करें" : "Switch to Dark Mode")
                : (isHindi ? "लाइट मोड चालू करें (सफेद पृष्ठभूमि)" : "Switch to Light Mode")}
              className="h-8 px-2.5 sm:px-3 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm"
              title={isLight ? "Dark Mode" : "Light Mode"}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">{isHindi ? "डार्क" : "Dark"}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{isHindi ? "लाइट" : "Light"}</span>
                </>
              )}
            </button>

            {/* Vernacular Language Switcher */}
            <button
              onClick={toggleLanguage}
              aria-label={language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
              className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === "en" ? "हिन्दी" : "English"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={(key) => onApiKeyChange?.(key)}
        language={language}
      />
    </>
  );
}
