import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    glsl(), // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@fonts": path.resolve(__dirname, "client", "public", "fonts"),
    },
  },
  root: path.resolve(__dirname, "client"),
  // .env 파일을 프로젝트 루트에서 찾도록 설정
  envDir: path.resolve(__dirname),
  envPrefix: "VITE_",
  // 개발 서버 프록시 설정 (CORS 문제 해결용)
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "https://d0079ju0e7.execute-api.ap-northeast-2.amazonaws.com",
        changeOrigin: true,
        secure: true,
        // OPTIONS 요청도 프록시하도록 설정
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(`[프록시] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
        },
      },
      "/webhook": {
        target: process.env.VITE_API_BASE_URL || "https://d0079ju0e7.execute-api.ap-northeast-2.amazonaws.com",
        changeOrigin: true,
        secure: true,
        // OPTIONS 요청도 프록시하도록 설정
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(`[프록시] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
        },
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});
