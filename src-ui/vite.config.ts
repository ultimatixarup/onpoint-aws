import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, rootDir, "");
  const target = env.ONPOINT_PROXY_TARGET || "";
  const tripSummaryBaseUrl = env.VITE_TRIP_SUMMARY_BASE_URL || "";
  const vehicleStateBaseUrl = env.VITE_VEHICLE_STATE_BASE_URL || "";
  const tripSummaryTarget =
    env.ONPOINT_TRIP_SUMMARY_PROXY_TARGET ||
    (tripSummaryBaseUrl.startsWith("http") ? tripSummaryBaseUrl : "");
  const vehicleStateTarget =
    env.ONPOINT_VEHICLE_STATE_PROXY_TARGET ||
    (vehicleStateBaseUrl.startsWith("http") ? vehicleStateBaseUrl : "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy:
        target || tripSummaryTarget || vehicleStateTarget
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
              ...(vehicleStateTarget
                ? {
                    "/vehicle-state": {
                      target: vehicleStateTarget,
                      changeOrigin: true,
                      secure: true,
                      rewrite: (path) => path.replace(/^\/vehicle-state/, ""),
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
