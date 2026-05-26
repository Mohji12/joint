import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import viteCompression from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    // Add compression for production builds
    mode === "production" &&
      viteCompression({
        algorithm: "gzip",
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024, // Only compress files larger than 1KB
      }),
    mode === "production" &&
      viteCompression({
        algorithm: "brotliCompress",
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
        filename: "[path][base].br",
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Allow Vite to treat .glb and .mp4 files as static assets
  assetsInclude: ["**/*.glb", "**/*.mp4"],
  build: {
    // Optimize chunk splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React in the main vendor chunk so all code shares one React instance
          // (splitting react into its own chunk can cause "createContext of undefined" in lazy chunks)
          if (id.includes("node_modules")) {
            // Framer Motion in its own chunk (large library)
            if (id.includes("framer-motion")) {
              return "framer-motion";
            }
            // Radix UI components together
            if (id.includes("@radix-ui")) {
              return "radix-ui";
            }
            // TanStack Query
            if (id.includes("@tanstack")) {
              return "tanstack";
            }
            // React Router
            if (id.includes("react-router")) {
              return "react-router";
            }
            // Other large libraries
            if (id.includes("recharts")) {
              return "recharts";
            }
            // React, react-dom, and all other node_modules in vendor
            return "vendor";
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Increase chunk size warning limit (since we're splitting properly)
    chunkSizeWarningLimit: 1000,
    // Disable source maps for smaller builds (enable if needed for debugging)
    sourcemap: false,
    // Use esbuild for minification (faster and built-in)
    minify: "esbuild",
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "@tanstack/react-query",
    ],
    exclude: ["@radix-ui/react-tooltip"], // Exclude if not needed immediately
  },
}));
