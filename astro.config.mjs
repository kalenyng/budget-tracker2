import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

import react from '@astrojs/react';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),

  server: {
    port: 4321
  },

  integrations: [react()]
});