import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
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
      // ❌ KHÔNG CÓ VitePWA
      // ❌ KHÔNG SERVICE WORKER
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