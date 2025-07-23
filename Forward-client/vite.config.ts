// import { reactRouter } from "@react-router/dev/vite";
// import tailwindcss from "@tailwindcss/vite";
// import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths";
// /*import mkcert from 'vite-plugin-mkcert'*/
// import path from "path";

// // console.log(process.env)
// export default defineConfig({
//   server: {
//     host: "0.0.0.0",
//     port: 5173,
//     proxy: {
//       "/api": {
//         target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
//         secure: false,
//         changeOrigin: true,
//       },
//     },
//   },
//   plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), /*mkcert()*/],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "app"),
//     },
//   },
// });
import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
/*import mkcert from 'vite-plugin-mkcert'*/
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env variables from `.env` or environment during build
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:8000",
          secure: false,
          changeOrigin: true,
        },
      },
    },
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), /*mkcert()*/],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "app"),
      },
    },
  };
});
