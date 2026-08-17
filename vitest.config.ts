// Deliberately separate from vite.config.ts, which wraps
// @lovable.dev/vite-tanstack-config plus a Cloudflare/Workers build-only
// setup — vitest doesn't need any of that, and layering test config onto
// that wrapper risks destabilizing the production build. Vitest picks this
// file up on its own.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
