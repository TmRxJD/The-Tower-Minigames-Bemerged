import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "webcast-participating-oregon-gulf.trycloudflare.com",
      ],
  },
});
