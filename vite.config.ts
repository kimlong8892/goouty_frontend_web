import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Load custom env from .github/env-config
  const envMap: Record<string, string> = { development: 'dev', production: 'prod' };
  const envFolder = envMap[mode] || mode;
  const envJsonPath = path.resolve(process.cwd(), `.github/env-config/${envFolder}/env.json`);

  if (fs.existsSync(envJsonPath)) {
    try {
      const extraEnv = JSON.parse(fs.readFileSync(envJsonPath, 'utf-8'));
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
        'localhost',
        'local.goouty.com',
        env.VITE_FRONTEND_URL ? new URL(env.VITE_FRONTEND_URL).hostname : undefined
      ].filter(Boolean) as string[],
      // Enable SPA fallback for client-side routing
      historyApiFallback: true,
      proxy: {
        // bắt mọi request bắt đầu bằng /api
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:3000", // NestJS backend
          changeOrigin: true,
          secure: false, // For development with self-signed certificates
          // ⚠️ Vì backend KHÔNG có prefix /api nên ta phải bỏ đi
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [
      {
        name: 'basic-auth',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const authUser = process.env.VITE_BASIC_AUTH_USER || env.VITE_BASIC_AUTH_USER;
            const authPass = process.env.VITE_BASIC_AUTH_PASS || env.VITE_BASIC_AUTH_PASS;

            if (!authUser || !authPass) {
              next();
              return;
            }

            // Skip auth for PWA manifest, service worker and assets
            const isPWAFile = req.url?.includes('manifest') ||
              req.url?.includes('sw.js') ||
              req.url?.includes('registerSW.js') ||
              req.url?.match(/\.(png|svg|ico|webmanifest)$/);

            // Skip auth for PWA mode (standalone)
            const isPWAMode = req.url?.includes('source=pwa');
            const hasPWACookie = req.headers.cookie?.includes('pwa_auth=true');

            if (isPWAMode) {
              // Set a cookie to remember PWA mode for subsequent requests during the session
              res.setHeader('Set-Cookie', 'pwa_auth=true; Path=/; SameSite=Lax');
              next();
              return;
            }

            if (hasPWACookie || isPWAFile) {
              next();
              return;
            }

            // Apply only to main document request if possible, or all.
            // Construct expected Basic Auth header value (Base64)
            const expectedAuth = Buffer.from(`${authUser}:${authPass}`).toString('base64');
            const authHeader = req.headers.authorization || '';
            const b64auth = authHeader.split(' ')[1] || '';

            if (b64auth !== expectedAuth) {
              res.statusCode = 401;
              res.setHeader('WWW-Authenticate', 'Basic realm="Goouty Dev"');
              res.end('Access denied');
              return;
            }
            next();
          });
        }
      },
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'logo.png', 'goouty-logo.svg', 'favicon_v2.png', '*.png'],
        manifest: {
          name: 'Goouty',
          short_name: 'Goouty',
          description: 'Lên kế hoạch chuyến đi, chia tiền nhóm, không rắc rối',
          theme_color: '#edeeff',
          background_color: '#edeeff',
          display: 'standalone',
          scope: '/',
          start_url: '/?source=pwa',
          lang: 'vi',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/favicon_v2.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/favicon_v2.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Tạo chuyến đi mới',
              short_name: 'Tạo chuyến đi',
              description: 'Tạo một chuyến đi mới nhanh chóng',
              url: '/create-trip',
              icons: [{ src: '/goouty-logo.svg', sizes: 'any', type: 'image/svg+xml' }]
            },
            {
              name: 'Chuyến đi của tôi',
              short_name: 'Chuyến đi',
              description: 'Xem danh sách chuyến đi của bạn',
              url: '/trips',
              icons: [{ src: '/favicon_v2.png', sizes: 'any', type: 'image/png' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
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
