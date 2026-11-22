"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Check, X, Shield, ExternalLink, Terminal } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  language: "en" | "hi";
}

export function ApiKeyModal({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  language,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isHindi = language === "hi";

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput("");
    onSaveKey("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up"
    >
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-main)] shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-inner)] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <KeyRound className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h3 id="api-key-modal-title" className="font-serif-title font-bold text-lg text-[var(--text-main)]">
              {isHindi ? "Google Gemini API Key कॉन्फ़िगर करें" : "Configure Gemini API Key"}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {isHindi
                ? "सुरक्षित ऑन-डिवाइस या टर्मिनल इनपुट"
                : "Secure local session & terminal execution"}
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2.5 text-xs text-[var(--text-sub)]">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p>
            {isHindi
              ? "आपकी API Key केवल आपके स्थानीय ब्राउज़र सेशन में रहती है और कभी किसी तीसरे सर्वर पर नहीं भेजी जाती।"
              : "Your API key is never committed to GitHub or saved on public servers. It is used locally to call Gemini AI."}
          </p>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-sub)] block">
            {isHindi ? "Gemini API Key दर्ज करें" : "Enter Gemini API Key"}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-mid)] text-[var(--text-main)] placeholder-[var(--text-dim)] text-sm font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal alternative info */}
        <div className="p-3 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-sub)]">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isHindi ? "टर्मिनल विधि:" : "Terminal Setup Option:"}</span>
          </div>
          <p>
            {isHindi
              ? "आप टर्मिनल में यह कमांड चलाकर भी अपनी की दर्ज कर सकते हैं:"
              : "You can also set your key via the terminal without opening files:"}
          </p>
          <code className="block px-2 py-1 bg-black/20 dark:bg-black/40 rounded text-emerald-400 font-mono text-[11px]">
            npm run setup:key
          </code>
        </div>

        {/* Free key link */}
        <div className="text-center">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-medium underline underline-offset-4 transition-colors"
          >
            <span>{isHindi ? "मुफ़्त Gemini API Key प्राप्त करें" : "Get a free key from Google AI Studio"}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
          {keyInput && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              {isHindi ? "की हटाएं" : "Clear Key"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-inner)] transition-colors cursor-pointer"
          >
            {isHindi ? "रद्द करें" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isHindi ? "सहेज लिया!" : "Saved!"}</span>
              </>
            ) : (
              <span>{isHindi ? "सहेजें" : "Save API Key"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
