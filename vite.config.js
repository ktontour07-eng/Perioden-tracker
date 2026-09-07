import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * PWA-Konfiguration. Zielgeraete sind Handys, installiert ueber „Zum
 * Startbildschirm“ — nur dann laeuft die App standalone und offline.
 *
 * BASE_PATH erlaubt das Ausliefern in einem Unterverzeichnis (GitHub Pages
 * liefert unter /<repo>/ aus). Ohne die Variable laeuft alles wie bisher im
 * Wurzelverzeichnis — passend fuer Vercel, Netlify oder Cloudflare Pages.
 */
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Zyklus',
        short_name: 'Zyklus',
        description: 'Privates Zyklus-Tagebuch. Alle Daten bleiben auf diesem Gerät.',
        lang: 'de',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f5',
        theme_color: '#faf7f5',
        categories: ['health', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Die App ist vollstaendig offline nutzbar: es gibt keine Netzaufrufe.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2020',
  },
})
