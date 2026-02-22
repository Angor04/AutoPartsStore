import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Configurado para Node.js (Coolify, Docker, VPS)
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '4321'),
  },
  site: process.env.SITE_URL || 'https://boss.victoriafp.online',
  integrations: [
    react(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    sitemap(),
  ],
  vite: {
    ssr: {
      external: ['@supabase/supabase-js'],
    },
  },
  image: {
    domains: ['aebzgxrpvbwmcktnvkea.supabase.co'],
  },
  security: {
    checkOrigin: false,
  },
});
