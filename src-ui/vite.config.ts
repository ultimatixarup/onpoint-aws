import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.ONPOINT_PROXY_TARGET || "";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: target
        ? {
            "/api": {
              target,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/api/, ""),
            },
          }
        : undefined,
    },
    test: {
      environment: "jsdom",
      setupFiles: "src/setupTests.ts",
      globals: true,
    },
  };
});
