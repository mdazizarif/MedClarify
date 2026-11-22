import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use 'node' environment for pure TS unit tests (no DOM needed for lib tests)
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Use vmForks pool to handle ESM compatibility
    pool: "vmForks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/types/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
