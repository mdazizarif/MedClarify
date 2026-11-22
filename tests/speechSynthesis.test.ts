import { describe, it, expect } from "vitest";
import { splitText } from "@/lib/speechSynthesis";

describe("speechSynthesis - splitText", () => {
  it("splits Hindi text on danda (।) cleanly without orphan punctuation", () => {
    const hindi =
      "यह नुस्खा छाती के संक्रमण के इलाज के लिए है। 3 दवाएं दी गई हैं: Amoxicillin। पूरे 5 दिन का कोर्स अवश्य पूरा करें।";
    const chunks = splitText(hindi);

    expect(chunks.length).toBeGreaterThan(1);
    // Ensure no chunk is just punctuation
    for (const chunk of chunks) {
      expect(chunk.trim().length).toBeGreaterThan(0);
      expect(/[a-zA-Z\u0900-\u097F0-9]/.test(chunk)).toBe(true);
    }
  });

  it("splits English sentences on periods and question marks", () => {
    const english = "This prescription treats a chest infection. Take Amoxicillin three times daily. Finish the 5-day course.";
    const chunks = splitText(english);

    expect(chunks.length).toBe(3);
    expect(chunks[0]).toContain("chest infection");
    expect(chunks[1]).toContain("three times daily");
    expect(chunks[2]).toContain("5-day course");
  });

  it("handles empty or whitespace-only strings gracefully", () => {
    const chunks = splitText("   ");
    expect(chunks).toEqual([""]);
  });

  it("chunks long compound clauses into readable audio segments", () => {
    const longSentence =
      "यह नुस्खा छाती के संक्रमण के इलाज के लिए है, जिसमें 3 दवाएं दी गई हैं: Amoxicillin (संक्रमण के लिए), कफ सिरप (खांसी के लिए), और पेरासिटामोल (बुखार के लिए)।";
    const chunks = splitText(longSentence);

    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(130);
    }
  });
});
