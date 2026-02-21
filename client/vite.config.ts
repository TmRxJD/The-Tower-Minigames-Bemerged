import { defineConfig } from 'vite'

const useHmr443 = process.env.BEMERGED_HMR_CLIENT_PORT_443 === '1'

export default defineConfig({
  base: './',
  envDir: '../',
  server: {
    hmr: useHmr443 ? { clientPort: 443 } : undefined,
    allowedHosts: ['localhost', '127.0.0.1', 'romance-poster-lemon-reserves.trycloudflare.com'],
  },
})
