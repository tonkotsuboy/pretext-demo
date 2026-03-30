import { defineConfig } from "vite";

export default defineConfig({
  base: "/pretext-demo/",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        perf: "perf.html",
        masonry: "masonry.html",
        bubbles: "bubbles.html",
        canvasDemo: "canvas-demo.html",
        reflow: "reflow.html",
        ascii: "ascii.html",
        editorial: "editorial.html",
      },
    },
  },
});
