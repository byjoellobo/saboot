/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const root = import.meta.dirname;
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { version: string };

// Same policy as public/_headers, as a <meta> fallback for hosts that ignore
// _headers. (frame-ancestors cannot be set from a meta tag.) Build only: the
// dev server needs inline scripts for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://rfc3161.ai.moda",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const cspMeta: Plugin = {
  name: "saboot-csp-meta",
  apply: "build",
  transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" }],
};

// Set SABOOT_BASE=/repo-name/ to host under a sub-path (e.g. GitHub Pages).
const base = process.env.SABOOT_BASE ?? "/";

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    cspMeta,
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg", "logo.svg", "fonts/*.ttf", "fonts/ui/*.woff2", "fonts/OFL.txt"],
      manifest: {
        name: "Saboot: electronic evidence certificate helper",
        short_name: "Saboot",
        description:
          "Hash WhatsApp chats, screenshots, recordings and CCTV files on your own device and draft the Section 63(4) BSA certificate. Not legal advice.",
        lang: "en-IN",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#f6f1e7",
        theme_color: "#1d2b4f",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,wasm,svg,png,ico,ttf,woff2,txt,webmanifest}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/\/verify\.html/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        verify: resolve(root, "verify.html"),
      },
    },
  },
  worker: { format: "es" },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts", "src/sakshya/**/*.ts"],
      exclude: ["src/**/*.worker.ts", "src/engine/hash/hash-pool.ts", "src/**/*.d.ts"],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      reporter: ["text-summary", "text"],
    },
  },
});
