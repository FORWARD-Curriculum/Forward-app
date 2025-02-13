import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        secure: false,
      },
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
});
