import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        // Componentes generados por shadcn/ui: son de la librería, no código propio.
        "components/ui/**",
        // Escenas 3D con three.js: necesitan WebGL, que jsdom no tiene.
        "components/copa-3d*.tsx",
        "components/hero-particles*.tsx",
      ],
      reporter: ["text-summary", "text", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Mínimo que pide la consigna. Si un PR baja la cobertura de esto, el CI falla.
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
})
