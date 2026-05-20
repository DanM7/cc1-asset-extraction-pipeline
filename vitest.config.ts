import path from "path";
import { defineConfig } from "vitest/config";

const ENGINE_ROOT = path.resolve(__dirname, "../2d-tile-engine");

export default defineConfig({
  resolve: {
    alias: {
      "@engine": path.join(ENGINE_ROOT, "engine"),
      "@tile-engine": path.join(ENGINE_ROOT, "tile-engine"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
