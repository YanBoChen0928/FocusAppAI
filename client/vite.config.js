import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // load environment variables
  const env = loadEnv(mode, process.cwd());

  // ensure the API URL is set correctly in production environment
  const apiUrl = env.VITE_API_URL || "http://localhost:5050";
  console.log(`Building with API URL: ${apiUrl} in mode: ${mode}`);

  // ensure environment variables are available in production build
  const htmlPlugin = () => {
    return {
      name: "html-transform",
      transformIndexHtml(html) {
        return html.replace(
          /<\/head>/,
          `<script>window.ENV = ${JSON.stringify({
            VITE_API_URL: apiUrl,
          })}</script></head>`
        );
      },
    };
  };

  // development environment configuration
  const devConfig = {
    server: {
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };

  // production environment configuration
  const prodConfig = {
    // production environment does not need proxy
  };

  return {
    plugins: [react(), htmlPlugin()],
    ...(mode === "production" ? prodConfig : devConfig),
  };
});
