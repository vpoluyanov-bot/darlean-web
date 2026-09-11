import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // The canonical host. Everything that needs an absolute URL — canonical
  // tags, the sitemap — is built from this, so it lives in exactly one place.
  site: 'https://www.darlean.com',
  integrations: [tailwind({ applyBaseStyles: false })],
});
