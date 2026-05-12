import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // serve index.html for all routes so React Router handles them
    historyApiFallback: true,
  },
});
