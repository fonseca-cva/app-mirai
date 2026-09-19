import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Los specs de Playwright (e2e/) NO son tests de vitest: los ejecuta
    // `playwright test`. Sin esta exclusión, vitest intenta importarlos y falla
    // porque `@playwright/test` no es un runner de vitest.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
