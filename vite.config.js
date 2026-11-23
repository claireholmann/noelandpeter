import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Vite's built-in asset detection is case-sensitive, so uppercase extensions (e.g. from cameras) need to be listed
  assetsInclude: ['**/*.JPG', '**/*.JPEG', '**/*.PNG'],
});
