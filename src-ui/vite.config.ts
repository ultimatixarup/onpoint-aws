import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.ONPOINT_PROXY_TARGET || "";
  const tripSummaryBaseUrl = env.VITE_TRIP_SUMMARY_BASE_URL || "";
  const tripSummaryTarget =
    env.ONPOINT_TRIP_SUMMARY_PROXY_TARGET ||
    (tripSummaryBaseUrl.startsWith("http") ? tripSummaryBaseUrl : "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy:
        target || tripSummaryTarget
          ? {
              ...(target
                ? {
                    "/api": {
                      target,
                      changeOrigin: true,
                      secure: true,
                      rewrite: (path) => path.replace(/^\/api/, ""),
                    },
                  }
                : {}),
              ...(tripSummaryTarget
                ? {
                    "/trip-summary": {
                      target: tripSummaryTarget,
                      changeOrigin: true,
                      secure: true,
                      rewrite: (path) => path.replace(/^\/trip-summary/, ""),
                    },
                  }
                : {}),
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
