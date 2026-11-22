import { describe, it, expect } from "vitest";
import { redactPII, containsPII, detectPIITypes } from "@/lib/piiRedactor";

describe("piiRedactor", () => {
  // ─── redactPII ────────────────────────────────────────────────────────────

  describe("redactPII", () => {
    it("redacts Indian mobile numbers (10-digit)", () => {
      const input = "Contact me at 9876543210 for more info.";
      const result = redactPII(input);
      expect(result).not.toContain("9876543210");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts Indian mobile numbers with +91 prefix", () => {
      const input = "My number is +919876543210";
      const result = redactPII(input);
      expect(result).not.toContain("+919876543210");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts email addresses", () => {
      const input = "Send reports to patient@hospital.com please.";
      const result = redactPII(input);
      expect(result).not.toContain("patient@hospital.com");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts email addresses with subdomains", () => {
      const input = "Contact dr.sharma@apollo.hospital.in for queries.";
      const result = redactPII(input);
      expect(result).not.toContain("dr.sharma@apollo.hospital.in");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts Aadhaar numbers (12-digit, spaced)", () => {
      const input = "Patient UID: 1234 5678 9012";
      const result = redactPII(input);
      expect(result).not.toContain("1234 5678 9012");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts Aadhaar numbers (12-digit, unspaced)", () => {
      const input = "Aadhaar: 123456789012";
      const result = redactPII(input);
      expect(result).not.toContain("123456789012");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts PAN card numbers", () => {
      const input = "PAN: ABCDE1234F for tax purposes";
      const result = redactPII(input);
      expect(result).not.toContain("ABCDE1234F");
      expect(result).toContain("[REDACTED]");
    });

    it("redacts multiple PII types in one string", () => {
      const input =
        "Call 9876543210 or email test@example.com. Aadhaar: 1234 5678 9012.";
      const result = redactPII(input);
      expect(result).not.toContain("9876543210");
      expect(result).not.toContain("test@example.com");
      expect(result).not.toContain("1234 5678 9012");
    });

    it("preserves non-PII medical text", () => {
      const input = "Take Paracetamol 500mg twice daily for 5 days.";
      const result = redactPII(input);
      expect(result).toBe(input);
    });

    it("handles empty string gracefully", () => {
      expect(redactPII("")).toBe("");
    });

    it("handles text with no PII", () => {
      const input = "Blood glucose level is 95 mg/dL (normal range: 70–99).";
      const result = redactPII(input);
      expect(result).toBe(input);
    });

    it("does not mutate the original string", () => {
      const input = "Contact: 9876543210";
      redactPII(input);
      expect(input).toBe("Contact: 9876543210");
    });
  });

  // ─── containsPII ─────────────────────────────────────────────────────────

  describe("containsPII", () => {
    it("returns true for text with phone number", () => {
      expect(containsPII("Call 9876543210")).toBe(true);
    });

    it("returns true for text with email", () => {
      expect(containsPII("Email: user@example.com")).toBe(true);
    });

    it("returns false for clean medical text", () => {
      expect(containsPII("Hemoglobin: 12.5 g/dL")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(containsPII("")).toBe(false);
    });
  });

  // ─── detectPIITypes ──────────────────────────────────────────────────────

  describe("detectPIITypes", () => {
    it("detects IndianPhone type", () => {
      const types = detectPIITypes("My number: 9876543210");
      expect(types).toContain("IndianPhone");
    });

    it("detects Email type", () => {
      const types = detectPIITypes("Email: user@test.com");
      expect(types).toContain("Email");
    });

    it("returns empty array for clean text", () => {
      const types = detectPIITypes("Blood pressure: 120/80");
      expect(types).toHaveLength(0);
    });

    it("detects multiple types", () => {
      const types = detectPIITypes("Phone: 9876543210, email: a@b.com");
      expect(types.length).toBeGreaterThan(1);
    });
  });
});
