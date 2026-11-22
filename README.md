# MedClarify ⚕️

> **AI-Powered Vernacular Prescription & Lab Report Translator**  
> Helping patients and caregivers decode handwritten prescriptions and complex blood test reports into plain, easy-to-understand language (English & Hindi) with interactive voice narration.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_UI-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-92_Passed-6E9F18?logo=vitest)](https://vitest.dev/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-emerald)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🩺 The Real-World Problem

Millions of patients leave clinics and diagnostic labs unable to decipher their medical papers:
- **Handwritten Doctor Prescriptions**: Unclear handwriting, abbreviated instructions (`OD`, `BD`, `TDS`, `HS`, `AC`, `PC`), and unfamiliar brand vs. generic names often lead to incorrect dosages, missed medicines, or accidental drug interactions.
- **Complex Lab Reports**: Diagnostic sheets (e.g., Complete Blood Count, Lipid Profiles, Metabolic Panels) list clinical acronyms and numeric reference ranges with zero plain-language explanation of what an out-of-range value means.
- **Vernacular Barrier**: The vast majority of healthcare documents in India are issued in English, creating a steep language barrier for Hindi-speaking patients and elderly family members.

**MedClarify** resolves this by pairing **Google Gemini Multimodal AI** with **vernacular text-to-speech** and **client-side privacy protection** to deliver plain-language clinical insights anyone can understand.

---

## ✨ Key Capabilities

| Capability | Description |
|---|---|
| 📄 **Multimodal Upload** | Drag & drop medical photos (JPEG, PNG, WEBP) or multi-page PDF documents. |
| 🤖 **Gemini Multimodal AI** | Analyzes prescriptions and lab reports using `gemini-3.5-flash` with strict JSON schema enforcement (`responseSchema`). |
| 🌐 **Bilingual (English & Hindi)** | One-click toggle between English and Hindi across the entire interface, medical summaries, and dosage instructions. |
| 🔊 **Voice Read-Aloud ("सुनें / Listen")** | Audio narration powered by a hybrid engine (`/api/tts` streaming for fluent Hindi pronunciation + Web Speech API for English). |
| 💊 **Daily Dosage Routine** | Automatically organizes medicines into **Morning 🌅**, **Afternoon ☀️**, **Evening 🌆**, and **Night 🌙** time slots with food instructions (e.g., *after meals*). |
| 🩸 **Biomarker Visualizer** | Color-coded flags for blood markers (**Normal** in green, **Borderline** in amber, **Attention Needed** in rose) with reference range indicators. |
| 🔒 **Client-Side PII Redaction** | Strips patient names, phone numbers, emails, Aadhaar numbers, and PAN cards *before* any data reaches external AI models. |
| 🌗 **Light / Dark Themes** | Calming medical emerald theme with accessible contrast and instant Dark/Light switching. |
| 🔍 **Dynamic Text Scaling** | Accessibility controls with standard (`A`), large (`A+`), and extra-large (`A++`) font sizes for low-vision patients. |
| 🧪 **Instant Demo Samples** | Test the full experience with one click (Doctor's Handwritten Prescription or CBC Blood Panel) without needing an API key. |

---

## 🔒 Security & Privacy Guarantee

- **Zero Data Retention**: Documents and analyses are never persisted to a database or shared with third parties.
- **PII Scrubbing**: Regex filters automatically sanitize Indian phone numbers, emails, 12-digit Aadhaar IDs, and 10-digit PAN cards on the client before calling the backend.
- **Safe Key Management**: API keys are **never** committed to version control. The `.env.local` file is excluded in `.gitignore`.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: Version 18.x or higher (recommended: Node 20 or 22)
- **Package Manager**: `npm` (comes with Node.js)
- **Google Gemini API Key**: Free API key available at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/MedClarify.git
cd MedClarify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Your Gemini API Key

MedClarify provides **three easy ways** to set up your API key:

#### Option A: Interactive Terminal Setup (Recommended)
Run the built-in terminal setup script:
```bash
npm run setup:key
```
Follow the terminal prompt to enter your key. It safely writes to `.env.local` (which is gitignored).

#### Option B: Manual `.env.local` Setup
Copy the example template and paste your key:
```bash
cp .env.example .env.local
```
Then open `.env.local` in your editor and update:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

#### Option C: In-App Navbar Setup
You can also launch the app directly without creating a `.env.local` file:
- Click the **"API Key"** button in the top navbar of the web application.
- Paste your key directly in the modal (stored only in local browser memory).

> **Note**: You can test the app immediately without any API key by clicking the **"Handwritten Rx"** or **"CBC Blood Panel"** sample cards on the homepage!

---

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### 5. Run the Test Suite
MedClarify comes with a comprehensive Vitest test suite covering medical logic, PII redaction, API validation, and speech synthesis chunking:
```bash
npm test
```
*(All 92 unit tests will execute and pass)*

---

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 🏗️ Project Architecture

```
MedClarify/
├── .env.example               # Safe environment variable template for GitHub
├── .gitignore                 # Enforces security; ignores secrets (.env.local)
├── firebase.json              # Firebase Hosting deployment configuration
├── next.config.ts             # Security headers, CSP & Turbopack configurations
├── package.json               # Dependencies and custom scripts
├── tsconfig.json              # Strict TypeScript settings
├── vitest.config.ts           # Vitest configuration for unit & DOM testing
│
├── scripts/
│   └── setup-key.mjs          # Interactive CLI prompt for configuring GEMINI_API_KEY
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root application layout with Google Fonts
│   │   ├── page.tsx           # Main workspace (Hero, Dropzone, Demos, Results)
│   │   ├── globals.css        # Tailwind utility layers & accessibility styles
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts   # Secure backend handler invoking Gemini AI
│   │       └── tts/
│   │           └── route.ts   # Vernacular Hindi streaming audio route
│   │
│   ├── components/
│   │   ├── AccessibilityBar.tsx # Language (EN/HI), theme (Light/Dark), font scale
│   │   ├── ApiKeyModal.tsx      # Secure in-browser Gemini API Key configuration
│   │   ├── DemoSamples.tsx      # Instant sample cards (Rx & CBC blood panel)
│   │   └── ReportResults.tsx    # Summary, Voice Speak CTA, Dosage Routine, Biomarkers
│   │
│   ├── lib/
│   │   ├── gemini.ts            # Google GenAI SDK wrapper with responseSchema
│   │   ├── medicalLogic.ts      # Clinical rules, biomarker ranges & schedule slotting
│   │   ├── piiRedactor.ts       # Indian PII detection (Aadhaar, PAN, phone, email)
│   │   ├── imageOptimizer.ts    # Client-side HTML5 Canvas compression
│   │   └── speechSynthesis.ts   # Hybrid TTS player (Audio queue + Web Speech)
│   │
│   └── types/
│       └── medical.ts           # Type definitions for medications, biomarkers & API
│
└── tests/
    ├── setup.ts                 # Vitest DOM environment setup
    ├── apiValidation.test.ts    # Tests for file size, MIME types, and error states
    ├── medicalLogic.test.ts     # Tests for biomarker severity and daily schedule slots
    ├── piiRedactor.test.ts      # Tests for Aadhaar, PAN, phone, and email redaction
    └── speechSynthesis.test.ts  # Tests for Hindi danda splitting and audio chunking
```

---

## 🧠 Google Services Integration

### 1. Google Gemini Multimodal API (`@google/genai`)
- **Multimodal Understanding**: Inspects messy handwriting, printed clinic stamps, and multi-column lab charts in one forward pass.
- **Deterministic Structured JSON**: Uses `responseSchema` with `Type.OBJECT` to guarantee strictly validated JSON conforming to the `AnalysisResult` TypeScript interface.
- **Model Fallback Chain**: Defaults to `gemini-3.5-flash` with automatic fallback to `gemini-3.1-flash-lite`, `gemini-3.8-flash`, and `gemini-3.7-flash` with exponential backoff on demand spikes.

### 2. Google Cloud Text-to-Speech / Streaming Audio
- Provides crystal-clear native Hindi pronunciation for elderly patients and individuals with visual impairments or reading difficulties.
- Automatically splits complex Devanagari sentences on Hindi danda (`।`) and punctuation boundaries to ensure fluent, continuous narration.

### 3. Firebase Hosting Ready
- Includes pre-configured `firebase.json` and `.firebaserc` files for single-command deployment to Firebase Hosting or Firebase App Hosting.

---

## 🧪 Testing Summary

```
 RUN  v4.1.12
 ✓ tests/apiValidation.test.ts    (30 tests)
 ✓ tests/speechSynthesis.test.ts  (4 tests)
 ✓ tests/piiRedactor.test.ts      (20 tests)
 ✓ tests/medicalLogic.test.ts     (38 tests)

 Test Files  4 passed (4)
      Tests  92 passed (92)
```

To run tests in watch mode:
```bash
npm run test:watch
```

---

## 🚢 Firebase Deployment

### Deploy to Firebase Hosting:
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Google / Firebase
firebase login

# 3. Associate your project
firebase use <your-firebase-project-id>

# 4. Deploy
firebase deploy
```

---

## 📜 Medical Disclaimer

> **IMPORTANT**: MedClarify is an educational and accessibility assistance tool designed to help patients understand medical documentation. It does not provide medical diagnosis, clinical judgment, or treatment recommendations. Always consult a qualified healthcare professional before taking, stopping, or modifying any medication or health routine.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Crafted with clinical precision for accessible patient-first healthcare.*
