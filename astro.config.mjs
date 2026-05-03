import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

import react from '@astrojs/react';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),

  devToolbar: {
    enabled: false,
  },

  server: {
    port: 4321,
    // Listen on all interfaces so http://localhost:4321 and http://<LAN-IP>:4321 work
    host: true
  },

  integrations: [react()]
});