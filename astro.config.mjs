import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// Configurado para Vercel
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: process.env.SITE_URL || 'http://localhost:4322',
  integrations: [
    react(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
  ],
  vite: {
    ssr: {
      external: ['@supabase/supabase-js'],
    },
  },
  image: {
    domains: ['your-supabase-project.supabase.co'],
  },
});
