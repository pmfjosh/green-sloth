import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ["@computational-biology-aachen/design"],
  },
  server: { port: 5177, strictPort: true },
});
