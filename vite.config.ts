import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // Load custom env from .github/env-config
  const envMap: Record<string, string> = {
    development: "dev",
    production: "prod",
  };
  const envFolder = envMap[mode] || mode;
  const envJsonPath = path.resolve(
    process.cwd(),
    `.github/env-config/${envFolder}/env.json`
  );

  if (fs.existsSync(envJsonPath)) {
    try {
      const extraEnv = JSON.parse(fs.readFileSync(envJsonPath, "utf-8"));
      Object.assign(env, extraEnv);
    } catch (e) {
      console.warn(`Could not parse env file: ${envJsonPath}`, e);
    }
  }

  return {
    server: {
      host: "::",
      port: parseInt(env.VITE_DEV_PORT) || 8080,
      allowedHosts: [
        "localhost",
        "local.goouty.com",
        env.VITE_FRONTEND_URL
          ? new URL(env.VITE_FRONTEND_URL).hostname
          : undefined,
        "hoang-local.goouty.com",
        "hoang-local.nguyenkimlongdev.click"
      ].filter(Boolean) as string[],
      historyApiFallback: true,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },

    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon_v2.png", "goouty-logo.svg", "footer_logo_circle_1765975206486.png"],
        manifest: {
          name: "Goouty",
          short_name: "Goouty",
          description: "Goouty - Ứng dụng lập kế hoạch chuyến đi và quản lý chi phí nhóm",
          theme_color: "#edeeff",
          background_color: "#edeeff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "footer_logo_circle_1765975206486.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "footer_logo_circle_1765975206486.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "footer_logo_circle_1765975206486.png",
              sizes: "1024x1024",
              type: "image/png",
            },
            {
              src: "footer_logo_circle_1765975206486.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],

    build: {
      outDir: "dist",
      sourcemap: false,
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});