import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],

        // Workbox runtime caching: serve ALL JS/CSS assets from cache,
        // refresh in background (staleWhileRevalidate).
        // This is the key fix: users never see a 404 on stale chunks.
        workbox: {
          // Precache all essential assets but NOT oversized SVGs
          globPatterns: ['**/*.{js,css,html,ico,png,woff,woff2}'],
          // Explicitly exclude the huge SVG files (15.9MB each) from precache
          globIgnores: ['**/favicon.svg', '**/safari-pinned-tab.svg'],

          // Max precache file size: 5MB (covers all JS chunks)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

          runtimeCaching: [
            {
              // Cache all Vite JS chunks stale-while-revalidate
              urlPattern: /\/assets\/.+\.(js|mjs)(\?.*)?$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'js-chunks',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache CSS files
              urlPattern: /\/assets\/.+\.css(\?.*)?$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'css-chunks',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Google Fonts stale-while-revalidate
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },

        manifest: {
          name: 'RelaySchool | Power System Protection',
          short_name: 'RelaySchool',
          description: 'Advanced power system protection simulator for electrical engineers.',
          theme_color: '#0ea5e9',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Increase chunk size warning limit slightly to avoid noise
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Split vendor libraries into dedicated long-lived cached chunks
          manualChunks: (id: string) => {
            // Core React stack – rarely changes
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            if (id.includes('react/')) return 'react-vendor';
            // Animation
            if (id.includes('framer-motion')) return 'framer-vendor';
            // Charting
            if (id.includes('recharts')) return 'chart-vendor';
            // Math rendering
            if (id.includes('katex')) return 'math-vendor';
            // Lucide icons — separate to avoid bloating page chunks
            if (id.includes('lucide-react')) return 'lucide-vendor';
          },
        }
      }
    }
  };
});
