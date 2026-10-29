// ESLint flat config: TypeScript, React hooks, and a few rules
// that matter for an evidence tool (no stray console output, no `any`).
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "dev-dist/",
      "coverage/",
      "test-results/",
      "playwright-report/",
      "crates/",
      "node_modules/",
      ".remember/",
      ".playwright-mcp/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.worker } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["error", { allow: ["error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tests/**/*.ts", "scripts/**/*.mjs", "*.config.{ts,js}"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },
);
