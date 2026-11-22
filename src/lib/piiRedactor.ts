/**
 * @file piiRedactor.ts
 * @description Utility module to scrub personally identifiable information (PII)
 * from text before sending it to external AI APIs.
 *
 * Redacted patterns:
 * - Indian mobile numbers (10-digit, with or without +91 prefix)
 * - International phone numbers
 * - Email addresses
 * - Aadhaar numbers (12-digit UID)
 * - PAN card numbers
 * - Passport numbers (Indian format)
 * - Generic long numeric ID strings (≥ 8 digits)
 */

/** Replacement token for redacted values */
const REDACTION_PLACEHOLDER = "[REDACTED]";

/**
 * Regex patterns for PII detection.
 * Each pattern is documented with the type of PII it targets.
 */
const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    // Indian mobile: optional country code +91 or 0, then 10 digits starting with 6-9
    name: "IndianPhone",
    pattern: /(?:\+91|0)?[6-9]\d{9}/g,
  },
  {
    // International phone with country code: +X through +XXX followed by 7-12 digits
    name: "InternationalPhone",
    pattern: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  },
  {
    // Generic phone number formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, etc.
    name: "GenericPhone",
    pattern: /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g,
  },
  {
    // RFC 5321 email addresses
    name: "Email",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },
  {
    // Aadhaar UID: 12 digits, often spaced as XXXX XXXX XXXX
    name: "Aadhaar",
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  },
  {
    // Indian PAN card: 5 uppercase letters, 4 digits, 1 uppercase letter
    name: "PAN",
    pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  },
  {
    // Indian passport: 1 uppercase letter + 7 digits
    name: "IndianPassport",
    pattern: /\b[A-Z]\d{7}\b/g,
  },
  {
    // Generic 8+ digit numeric IDs (catch-all for ID numbers)
    name: "GenericID",
    pattern: /\b\d{8,}\b/g,
  },
];

/**
 * Redacts all detected PII patterns from the given text.
 *
 * @param text - The raw text potentially containing PII.
 * @returns A sanitized copy of the text with PII replaced by [REDACTED].
 *
 * @example
 * ```ts
 * redactPII("Call me at 9876543210 or email me at user@example.com");
 * // → "Call me at [REDACTED] or email me at [REDACTED]"
 * ```
 */
export function redactPII(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text;
  for (const { pattern } of PII_PATTERNS) {
    // Reset lastIndex for global regexes to ensure correct behavior
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, REDACTION_PLACEHOLDER);
  }
  return sanitized;
}

/**
 * Checks whether a given text contains detectable PII.
 *
 * @param text - The text to check.
 * @returns True if any PII pattern matches.
 */
export function containsPII(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return PII_PATTERNS.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

/**
 * Returns a list of PII types detected in the text (for audit logging).
 *
 * @param text - The text to audit.
 * @returns Array of PII type names detected.
 */
export function detectPIITypes(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const detected: string[] = [];
  for (const { name, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      detected.push(name);
    }
  }
  return detected;
}
