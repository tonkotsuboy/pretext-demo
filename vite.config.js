import { defineConfig } from "vite";

export default defineConfig({
  base: "/pretext-demo/",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        ascii: "ascii.html",
        editorial: "editorial.html",
      },
    },
  },
});
