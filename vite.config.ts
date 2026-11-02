import { defineConfig } from 'vite';

// GitHub Pages user site: served from the domain root, https://monga-hub.github.io/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        gioco: 'gioco.html',
        accedi: 'accedi.html',
        'nuova-password': 'nuova-password.html',
        saves: 'src/saves.ts',
      },
      // Keep the save client's exports and give it a fixed URL games can import.
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: (c) => (c.name === 'saves' ? 'hub/saves.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
});
