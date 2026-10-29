import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build (service worker included).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4791",
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx vite preview --port 4791 --strictPort",
    url: "http://localhost:4791",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
