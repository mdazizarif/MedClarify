# MedClarify ⚕️

> **AI-Powered Vernacular Prescription & Lab Report Translator**
> Helping patients decode handwritten prescriptions and dense lab reports into plain language (English & Hindi) with voice narration.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-92_Passed-6E9F18?logo=vitest)](https://vitest.dev/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-059669)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Chosen Vertical

**Healthcare Accessibility & AI-Assisted Patient Education**

MedClarify targets a critical gap in healthcare accessibility: millions of patients in India and other multilingual regions receive medical documents — handwritten prescriptions and diagnostic lab reports — that they cannot read or understand. The chosen vertical is **vernacular healthcare translation using multimodal AI**, serving patients, elderly individuals, and caregivers who face:

- Language barriers (documents in English, patients speaking Hindi or other regional languages)
- Literacy barriers (cryptic medical shorthand, clinical abbreviations)
- Accessibility barriers (low vision, elderly patients who benefit from audio narration)

The solution is specifically designed to empower patients to understand their own healthcare without depending entirely on a doctor's verbal explanation.

---

## 2. Problem Statement

**The Real-World Problem:** Millions of patients walk out of clinics unable to read handwritten prescriptions or understand dense blood test reports, leading to missed doses, anxiety, or accidental drug interactions.

Specifically, medical documents often contain:

1. **Handwritten Doctor Prescriptions:** Unclear handwriting and cryptic clinical shorthand (`OD` = once daily, `BD` = twice daily, `TDS` = three times daily, `HS` = at bedtime, `AC` = before meals, `PC` = after meals) that patients cannot safely follow.
2. **Dense Lab Reports:** Diagnostic sheets list biomarker acronyms (Hb, WBC, RBC, TSH, ALT) and numeric reference ranges with zero plain-language explanation of what an out-of-range value means for the patient's health.
3. **Language & Accessibility Barriers:** The vast majority of prescriptions and lab reports in India are written in English, creating a steep barrier for Hindi-speaking patients and elderly family members who need help managing medications.

**Impact of the Problem:**
- Missed or incorrect doses due to misread prescriptions
- Patient anxiety from unexplained "abnormal" lab values
- Accidental drug interactions from misunderstood schedules
- Elderly and low-vision patients unable to self-manage their healthcare

---

## 3. Approach and Logic

MedClarify uses a layered, privacy-first AI pipeline:

### 3.1 Client-Side Privacy Redaction (Before Any API Call)
Before any document data is sent to the backend, a client-side PII redactor (`src/lib/piiRedactor.ts`) automatically strips:
- Indian mobile numbers (10-digit, with/without +91 prefix)
- Email addresses (RFC 5321 pattern)
- Aadhaar numbers (12-digit UID, spaced or unspaced)
- PAN card numbers (5 uppercase letters + 4 digits + 1 letter)
- Indian passport numbers
- Generic long numeric ID strings (8+ digits)

This ensures patient identity information never reaches the AI model, addressing data privacy at the source.

### 3.2 Multimodal AI Analysis (Google Gemini)
The document image or PDF is sent to Google Gemini's multimodal API (`gemini-3.5-flash`) with:
- A `responseSchema` enforcing strict JSON output structure — no prompt engineering tricks or regex parsing
- `temperature: 0.1` for deterministic, medically accurate responses
- A system prompt instructing the model to respond at a Class 6 reading level in both English and Hindi
- Automatic model fallback chain: `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-3.8-flash` → `gemini-3.7-flash` with 500ms delay between attempts

### 3.3 Medical Logic Layer (Deterministic Post-Processing)
Returned data is validated and enriched by `src/lib/medicalLogic.ts`:
- **Biomarker severity classification:** Parses reference ranges (`13.5 – 17.5`, `> 40`, `< 100`) and classifies each value as `normal`, `borderline` (within 15% outside range), or `critical` (beyond 15% threshold)
- **Daily schedule grouping:** Maps medication time slots (`Morning`, `Afternoon`, `Evening`, `Night`) from free-text frequency strings (`OD`, `BD`, `TDS`, `HS`)

### 3.4 Vernacular Voice Narration (Hybrid TTS Engine)
A key accessibility innovation is the hybrid audio engine (`src/lib/speechSynthesis.ts`):
- **For Hindi:** Routes audio through the server-side `/api/tts` endpoint which streams native Hindi audio — this solves the critical problem where Windows English TTS voices silently skip Devanagari characters, producing only partial output like `"3 amoxicillin 5 5 "`
- **For English:** Uses native `SpeechSynthesis` Web API
- Sentence-level chunking on Hindi danda (`।`) and punctuation boundaries prevents Chromium's 15-second TTS cutoff bug

### 3.5 Smart Caching
Result caching using SHA-256 file hash + `sessionStorage` eliminates duplicate API calls for the same document, improving efficiency and reducing cost.

---

## 4. How the Solution Works

### Step-by-Step Flow

```
User uploads prescription photo or lab report PDF
            │
            ▼
Client: validateFile() → check MIME type (JPEG/PNG/WEBP/PDF) + max 5MB
            │
            ▼
Client: computeFileHash() → check sessionStorage cache
            │ (cache hit? → skip API, render instantly)
            ▼
Client: compressImage() → HTML5 Canvas resize (max 1280px, 0.8 quality)
            │
            ▼
Client: redactPII() → strip Aadhaar, PAN, phone, email from any text context
            │
            ▼
Server /api/analyze: re-validate MIME + size → call Gemini multimodal API
            │
            ▼
Gemini AI: analyze image/PDF → return structured JSON (medications, biomarkers, summary)
            │
            ▼
Server: post-process PII redaction on response text → return AnalysisResult
            │
            ▼
Client: cache result in sessionStorage → render ReportResults component
            │
            ├── Plain-language summary (English + Hindi)
            ├── Daily dosage routine (Morning / Afternoon / Evening / Night)
            ├── Biomarker grid (Normal / Borderline / Attention Needed)
            └── Voice narration button ("Listen" / "सुनें") → /api/tts audio stream
```

### Key User Interactions

| Action | What Happens |
|---|---|
| Upload a prescription image | Gemini extracts medications, dosage, frequency, purpose, food instructions |
| Upload a lab report | Gemini extracts biomarker values, flags out-of-range results, explains implications |
| Click "हिन्दी" | Entire UI, summaries, medication names, and biomarker explanations switch to Hindi |
| Click "सुनें (Speak)" | Audio narration streams Hindi speech via `/api/tts` or uses native TTS for English |
| Click "Light Mode" | UI switches to bright clinical white theme optimized for readability |
| Click font size A / A+ / A++ | Base font scales to 100% / 114% / 128% for low-vision users |
| Try Demo Sample | Instant sample prescription or lab report loads without uploading any file |

---

## 5. Assumptions Made

1. **Image Quality:** The solution assumes uploaded prescriptions/lab reports are reasonably legible (not completely blurred or rotated 180°). Gemini handles typical handwriting variations and partial occlusion but cannot recover from fundamentally unreadable scans.

2. **Indian Healthcare Context:** PII redaction patterns are calibrated for Indian identifiers (Aadhaar, PAN, +91 phone numbers). International patterns (SSN, NHS number) are not included in the current version.

3. **Hindi Language Scope:** The bilingual support covers Hindi (Devanagari script). Other Indian regional languages (Tamil, Telugu, Bengali, Marathi) are out of scope for this version.

4. **API Key Availability:** The app requires a valid Google Gemini API key (free tier available at [Google AI Studio](https://aistudio.google.com/app/apikey)). The key is never committed to the repository; users configure it via terminal prompt (`npm run setup:key`) or the in-app modal.

5. **Device Audio Support:** The Hindi voice narration streams from the server-side `/api/tts` endpoint using Google's TTS engine. An internet connection is required for Hindi audio. English narration uses the browser's built-in Web Speech API, which works offline.

6. **No Medical Diagnosis:** MedClarify is an accessibility and education tool, not a clinical diagnostic system. The AI explanations are designed to help patients understand their existing prescriptions and lab results — not to replace a doctor's advice.

7. **Session-Only Storage:** Analysis results are cached in `sessionStorage` (cleared when the browser tab closes) and never persisted to any server-side database.

---

## 6. Google AI Integration

### Google Gemini Multimodal API
- **Package:** `@google/genai` v3.6.1
- **Model:** `gemini-3.5-flash` (primary), with automatic fallback to `gemini-3.1-flash-lite`, `gemini-3.8-flash`, and `gemini-3.7-flash`
- **Why Gemini:** The only publicly available AI model capable of reading messy handwritten prescriptions AND structured lab report layouts in a single multimodal inference call
- **Structured Output:** `responseSchema` with `Type.OBJECT` enforces exact JSON — eliminates hallucinated formats and parsing failures
- **Temperature:** `0.1` for consistent, deterministic medical outputs

```typescript
// Simplified schema used for structured Gemini output
{
  documentType: "prescription" | "lab_report" | "unknown",
  summary: string,         // English plain-language explanation
  summaryHindi: string,    // Hindi (Devanagari) translation
  medications: [{
    name, dosage, frequency, duration, purpose,
    schedule: ["Morning" | "Afternoon" | "Evening" | "Night"],
    interactions: string[], notes: string
  }],
  biomarkers: [{
    name, value, unit, referenceRange,
    severity: "normal" | "borderline" | "critical",
    explanation, implication
  }],
  keyFindings: string[],
  confidence: number       // 0.0 – 1.0
}
```

---

## 7. Quick Start Guide

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- Free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/mdazizarif/MedClarify.git
cd MedClarify

# 2. Install dependencies
npm install

# 3. Configure API key (interactive terminal prompt)
npm run setup:key

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **No API key yet?** Click either sample card ("Handwritten Rx" or "CBC Blood Panel") on the homepage to try the full experience instantly with no upload needed.

### Available Commands
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm test             # Run all 92 unit tests
npm run setup:key    # Secure interactive API key setup
```

---

## 8. Project Structure

```
MedClarify/
├── .env.example               # Safe template for environment variables
├── .gitignore                 # Excludes .env.local and secrets from git
├── next.config.ts             # Security headers (CSP, X-Frame-Options, etc.)
├── scripts/
│   └── setup-key.mjs          # Interactive CLI for secure API key setup
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main page (upload, demo samples, results)
│   │   ├── layout.tsx         # Root layout with metadata and fonts
│   │   ├── globals.css        # Design tokens, Tailwind layers, themes
│   │   └── api/
│   │       ├── analyze/route.ts   # POST: Secure Gemini multimodal analysis
│   │       └── tts/route.ts       # GET: Hindi audio streaming endpoint
│   ├── components/
│   │   ├── AccessibilityBar.tsx   # Language, theme, font size controls
│   │   ├── ApiKeyModal.tsx        # In-app API key configuration modal
│   │   ├── DemoSamples.tsx        # Instant sample prescription/lab report
│   │   └── ReportResults.tsx      # Summary, dosage routine, biomarker grid
│   ├── lib/
│   │   ├── gemini.ts              # Gemini SDK client + fallback model chain
│   │   ├── medicalLogic.ts        # Biomarker classification + schedule slotting
│   │   ├── piiRedactor.ts         # Indian PII scrubbing (Aadhaar, PAN, phone)
│   │   ├── imageOptimizer.ts      # Canvas compression + file hash caching
│   │   └── speechSynthesis.ts     # Hybrid TTS (audio queue + Web Speech API)
│   └── types/
│       └── medical.ts             # TypeScript interfaces for all data models
└── tests/
    ├── apiValidation.test.ts      # 30 tests: file size, MIME, error states
    ├── medicalLogic.test.ts       # 38 tests: severity classification, scheduling
    ├── piiRedactor.test.ts        # 20 tests: Aadhaar, PAN, phone, email redaction
    └── speechSynthesis.test.ts    # 4 tests: Hindi danda splitting, audio chunking
```

---

## 9. Security Design

| Concern | Mitigation |
|---|---|
| **API Key Exposure** | Key lives only in `.env.local` (gitignored); never sent to the client bundle |
| **PII Leakage** | Automatic redaction of Aadhaar, PAN, phone, email at two layers: client and server |
| **File Safety** | MIME type allowlist + 5 MB size limit enforced server-side before any AI call |
| **Clickjacking** | `X-Frame-Options: DENY` header on all routes |
| **MIME Sniffing** | `X-Content-Type-Options: nosniff` header |
| **XSS** | Strict `Content-Security-Policy` header on every response |
| **Data Retention** | Zero server-side storage; results cached only in client `sessionStorage` |

---

## 10. Accessibility (WCAG 2.1 AA)

- **Semantic HTML:** `<header>`, `<main>`, `<section>`, `<nav>`, `<article>`, `<footer>`
- **ARIA Labels:** All interactive elements carry explicit `aria-label` attributes
- **Live Regions:** `aria-live="polite"` for loading states; `aria-live="assertive"` for critical errors
- **Keyboard Navigation:** Full tab-order and visible `focus-visible` rings throughout
- **High Contrast / Dark Mode:** One-click Light/Dark toggle, persisted across renders
- **Font Scaling:** Three levels (100% / 114% / 128%) for low-vision users
- **Audio Narration:** Fluent Hindi and English read-aloud for elderly or low-literacy users
- **Reduced Motion:** Respects `prefers-reduced-motion` media query

---

## 11. Test Coverage

```
 ✓ tests/apiValidation.test.ts    (30 tests)  — file size, MIME, error handling
 ✓ tests/speechSynthesis.test.ts   (4 tests)  — Hindi sentence splitting
 ✓ tests/piiRedactor.test.ts      (20 tests)  — Aadhaar, PAN, phone, email redaction
 ✓ tests/medicalLogic.test.ts     (38 tests)  — biomarker severity, schedule slotting

 Test Files  4 passed (4)
      Tests  92 passed (92)
```

---

## 12. Medical Disclaimer

> MedClarify is an educational and accessibility assistance tool designed to help patients understand their own medical documentation. It does **not** provide medical diagnosis, clinical judgment, or treatment recommendations. Always consult a qualified healthcare professional before changing any medication or health routine.

---

*Built with Next.js 16, Google Gemini Multimodal API, TypeScript, and Tailwind CSS.*
