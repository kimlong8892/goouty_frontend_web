import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    server: {
      host: "::",
      port: parseInt(env.VITE_DEV_PORT) || 8080,
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
            const authUser = process.env.VITE_BASIC_AUTH_USER || env.VITE_BASIC_AUTH_USER || 'goouty';
            const authPass = process.env.VITE_BASIC_AUTH_PASS || env.VITE_BASIC_AUTH_PASS || 'goouty';

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
        includeAssets: ['favicon.ico', 'logo.png', 'goouty-logo.svg', '*.png'],
        manifest: {
          name: 'Goouty',
          short_name: 'Goouty',
          description: 'Lên kế hoạch chuyến đi, chia tiền nhóm, không rắc rối',
          theme_color: '#6347f9',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/favicon_v2.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/favicon_v2.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Tạo chuyến đi mới',
              short_name: 'Tạo chuyến đi',
              description: 'Tạo một chuyến đi mới nhanh chóng',
              url: '/create-trip',
              icons: [{ src: '/create_trip_mascot.png', sizes: '192x192' }]
            },
            {
              name: 'Chuyến đi của tôi',
              short_name: 'Chuyến đi',
              description: 'Xem danh sách chuyến đi của bạn',
              url: '/trips',
              icons: [{ src: '/my_trips_mascot.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
