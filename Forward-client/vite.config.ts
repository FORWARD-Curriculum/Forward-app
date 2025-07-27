import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
/*import mkcert from 'vite-plugin-mkcert'*/
import path from "path";

export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), /*mkcert()*/],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "app"),
      },
    },
  };
});
