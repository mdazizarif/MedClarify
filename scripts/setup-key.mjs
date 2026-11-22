#!/usr/bin/env node

/**
 * @file setup-key.mjs
 * @description Secure terminal CLI to configure GEMINI_API_KEY for MedClarify.
 * Writes to .env.local (which is gitignored).
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n" + "═".repeat(60));
console.log("   MedClarify — Secure Gemini API Key Terminal Setup");
console.log("═".repeat(60));
console.log("\nGet a free API key at: https://aistudio.google.com/app/apikey\n");

rl.question("Enter your Google Gemini API Key: ", (rawKey) => {
  const key = rawKey.trim();
  if (!key) {
    console.error("\n❌ Error: API key cannot be empty. Setup aborted.\n");
    rl.close();
    process.exit(1);
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
    if (/^GEMINI_API_KEY=/m.test(content)) {
      content = content.replace(/^GEMINI_API_KEY=.*/m, `GEMINI_API_KEY=${key}`);
    } else {
      content += `\nGEMINI_API_KEY=${key}\n`;
    }
  } else {
    content = `# MedClarify Local Environment\nGEMINI_API_KEY=${key}\nNODE_ENV=development\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`;
  }

  fs.writeFileSync(envPath, content, "utf8");

  console.log("\n✅ Success! Gemini API key saved to .env.local");
  console.log("🔒 .env.local is in .gitignore and will NEVER be pushed to GitHub.");
  console.log("\nYou can now start the application:");
  console.log("   npm run dev\n");

  rl.close();
});
