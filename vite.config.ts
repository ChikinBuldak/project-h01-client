import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import fs from 'fs';
import { DiscordProxy } from '@robojs/patch';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    DiscordProxy.Vite(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
      "#": path.resolve(__dirname, '.')
    }
  },
  server: {
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'localhost+2-key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'localhost+2.pem')),
    // },
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Any request from your React app starting with /api...
      '/api': {
        // ...will be forwarded to your Rust server
        target: 'http://localhost:3001',

        // These options are important for it to work smoothly
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,     // Allows forwarding from https to http
        ws: true,          // For websocket support, if you add it later
      },
    },
  }
})
