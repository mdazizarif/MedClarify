/**
 * @file speechSynthesis.ts
 * @description Robust speech synthesizer for MedClarify.
 *
 * Implements:
 * 1. Hybrid speech engine:
 *    - For Hindi: Uses cloud-assisted high-fidelity TTS stream (/api/tts)
 *      to ensure fluent, natural Devanagari pronunciation even on Windows/devices
 *      without local Hindi language packs installed (prevents skipping Hindi text).
 *    - For English: Uses native SpeechSynthesis API with instant zero-latency voices.
 * 2. Pre-split sentence queue to avoid Chromium's 15-second cutoff bug.
 * 3. Immediate, responsive stopSpeaking() that halts both Audio and WebSpeech.
 * 4. Automatic fallback handling if offline or if audio encounters issues.
 */

interface SpeakOptions {
  text: string;
  language: "en" | "hi";
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let isStopped = false;
let keepAliveTimer: NodeJS.Timeout | null = null;
let currentAudio: HTMLAudioElement | null = null;
let audioQueueIndex = 0;

// Initialize voices listener if in browser
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Splits text into natural sentence boundaries (Hindi danda, periods, etc.)
 * avoids orphan punctuation chunks.
 */
export function splitText(text: string): string[] {
  // Regex to split on major boundaries (। . ? ! \n)
  const sentences = text
    .replace(/([।\.\?\!\n]+)/g, "$1<SPLIT>")
    .split("<SPLIT>")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /[^\s।\.\?\!\,\:\;]/.test(s));

  const result: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 120) {
      result.push(sentence);
    } else {
      // Sub-split long sentences on commas or colons
      const subs = sentence
        .replace(/([\,\;\:\(\)]+)/g, "$1<SUB>")
        .split("<SUB>")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && /[^\s।\.\?\!\,\:\;]/.test(s));

      let acc = "";
      for (const sub of subs) {
        if ((acc + " " + sub).length <= 100) {
          acc = acc ? `${acc} ${sub}` : sub;
        } else {
          if (acc) result.push(acc);
          acc = sub;
        }
      }
      if (acc) result.push(acc);
    }
  }

  return result.length > 0 ? result : [text.trim()];
}

/**
 * Checks if the browser has a genuine native Hindi TTS voice installed
 */
export function hasGenuineHindiVoice(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  return voices.some(
    (v) =>
      v.lang.toLowerCase().startsWith("hi") ||
      v.name.toLowerCase().includes("hindi") ||
      v.name.toLowerCase().includes("kalpana") ||
      v.name.toLowerCase().includes("hemant")
  );
}

/**
 * Finds the best matching voice for a language
 */
function findVoice(lang: "en" | "hi"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  cachedVoices = voices;

  if (lang === "hi") {
    // Only return genuine Hindi voices. NEVER return English voices (like en-in)
    // because English voices silently skip Devanagari text!
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ||
      voices.find((v) => v.name.toLowerCase().includes("hindi")) ||
      voices.find((v) => v.name.toLowerCase().includes("kalpana")) ||
      voices.find((v) => v.name.toLowerCase().includes("hemant"))
    );
  } else {
    return (
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith("en-us") &&
          (v.name.includes("Google") || v.name.includes("Natural"))
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en-")) ||
      voices.find((v) => v.default)
    );
  }
}

/**
 * Plays audio stream chunks using HTML5 Audio (primary for Hindi)
 */
function speakViaAudioQueue({
  sentences,
  language,
  rate = 1.0,
  onStart,
  onEnd,
  onError,
}: {
  sentences: string[];
  language: "en" | "hi";
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}): void {
  isStopped = false;
  audioQueueIndex = 0;
  let hasStarted = false;

  const playNextChunk = () => {
    if (isStopped || audioQueueIndex >= sentences.length) {
      if (currentAudio) {
        currentAudio = null;
      }
      if (!isStopped) onEnd?.();
      return;
    }

    const chunk = sentences[audioQueueIndex++];
    if (!chunk.trim()) {
      playNextChunk();
      return;
    }

    const encodedText = encodeURIComponent(chunk);
    const audioUrl = `/api/tts?text=${encodedText}&lang=${language}`;

    try {
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      audio.playbackRate = Math.max(0.75, Math.min(rate, 1.4));

      audio.onplay = () => {
        if (!hasStarted) {
          hasStarted = true;
          onStart?.();
        }
      };

      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        playNextChunk();
      };

      audio.onerror = (e) => {
        console.warn("[MedClarify TTS Audio] Chunk error, trying next sentence:", e);
        if (audioQueueIndex >= sentences.length) {
          onEnd?.();
        } else {
          playNextChunk();
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[MedClarify TTS Audio] Play error:", err);
          // If audio play failed and not started, fall back to native speech
          if (!hasStarted) {
            speakViaWebSpeech({
              sentences,
              language,
              rate,
              onStart,
              onEnd,
              onError,
            });
          }
        });
      }
    } catch (err) {
      console.warn("[MedClarify TTS Audio] Init error:", err);
      speakViaWebSpeech({
        sentences,
        language,
        rate,
        onStart,
        onEnd,
        onError,
      });
    }
  };

  playNextChunk();
}

/**
 * Native WebSpeech fallback
 */
function speakViaWebSpeech({
  sentences,
  language,
  rate = 1.0,
  onStart,
  onEnd,
  onError,
}: {
  sentences: string[];
  language: "en" | "hi";
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.("Speech synthesis is not supported on this device.");
    return;
  }

  // Workaround for Chromium paused engine bug
  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const voice = findVoice(language);
  let currentIndex = 0;
  let hasStarted = false;

  const speakNext = () => {
    if (isStopped || currentIndex >= sentences.length) {
      stopKeepAlive();
      if (!isStopped) onEnd?.();
      return;
    }

    const sentence = sentences[currentIndex++];
    const utterance = new SpeechSynthesisUtterance(sentence);

    utterance.rate = Math.max(0.7, Math.min(rate, 1.3));
    utterance.pitch = 1.0;
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";

    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    }

    utterance.onstart = () => {
      if (!hasStarted) {
        hasStarted = true;
        onStart?.();
        startKeepAlive();
      }
    };

    utterance.onend = () => {
      speakNext();
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") {
        return;
      }
      if (currentIndex >= sentences.length) {
        stopKeepAlive();
        onEnd?.();
      } else {
        speakNext();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();
}

/**
 * Speaks text using hybrid approach:
 * - For Hindi: uses /api/tts streaming endpoint for native, fluent Devanagari speech
 * - For English: uses native Web Speech API (with /api/tts fallback if unsupported)
 */
export function speakText({
  text,
  language,
  rate = 1.0,
  onStart,
  onEnd,
  onError,
}: SpeakOptions): void {
  stopSpeaking();
  isStopped = false;

  const sentences = splitText(text);
  if (sentences.length === 0) {
    onEnd?.();
    return;
  }

  if (language === "hi") {
    // For Hindi, always use the studio-quality /api/tts endpoint
    // to prevent Windows English voices from skipping Devanagari characters
    speakViaAudioQueue({
      sentences,
      language: "hi",
      rate,
      onStart,
      onEnd,
      onError,
    });
  } else {
    // For English, use native Web Speech if available, else fall back to audio queue
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speakViaWebSpeech({
        sentences,
        language: "en",
        rate,
        onStart,
        onEnd,
        onError,
      });
    } else {
      speakViaAudioQueue({
        sentences,
        language: "en",
        rate,
        onStart,
        onEnd,
        onError,
      });
    }
  }
}

/**
 * Chromium keep-alive timer to prevent garbage collection of long speech
 */
function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }
  }, 10000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

/**
 * Stops all speech synthesis (both HTML5 Audio and Web Speech)
 */
export function stopSpeaking(): void {
  isStopped = true;
  stopKeepAlive();

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
      currentAudio = null;
    } catch {
      /* ignore */
    }
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
