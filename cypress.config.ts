import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:8888',
        defaultCommandTimeout: 10_000,
    },
});
