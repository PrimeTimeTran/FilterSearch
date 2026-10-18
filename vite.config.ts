import { resolve } from "node:path";
import { defineConfig } from "vite";
import nunjucks from "vite-plugin-nunjucks";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/FilterSearch/" : "/",

  plugins: [
    nunjucks({
      templatesDir: resolve(process.cwd(), "src"),
    }),
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        privacy: resolve(process.cwd(), "privacy.html"),
        // privacy: resolve(process.cwd(), "public/privacy.html"),
        njkTest: resolve(process.cwd(), "njk-test.html"),
      },
    },
  },
}));
