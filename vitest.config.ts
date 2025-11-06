// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'; // <-- Import your React plugin
import { playwright } from '@vitest/browser-playwright';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                { browser: 'chromium' },
            ],
            headless: true,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, './src'),
            "#": path.resolve(__dirname, '.')
        }
    }
});