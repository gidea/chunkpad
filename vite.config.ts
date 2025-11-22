import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import electron from "vite-plugin-electron/simple";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const electronPlugins = await electron({
    main: {
      // Main process entry point
      entry: "electron/main.ts",
    },
    preload: {
      // Preload script entry point
      input: path.join(__dirname, "electron/preload.ts"),
      // Build preload as ESM (Electron 20+ supports ESM preload scripts)
      // Since package.json has "type": "module", .js files are treated as ESM
      vite: {
        build: {
          rollupOptions: {
            output: {
              format: "es",
              entryFileNames: (chunkInfo) => {
                // Output as .js (ESM) since package.json has "type": "module"
                return chunkInfo.name === 'preload' ? 'preload.js' : '[name].js';
              },
            },
          },
        },
      },
    },
    // Polyfill Node.js API for renderer process
    renderer: process.env.NODE_ENV === "test"
      ? // https://github.com/antfu/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        undefined
      : {},
  });

  return {
    // Use relative base path for Electron (works with file:// protocol)
    base: mode === "production" ? "./" : "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      wasm(),
      topLevelAwait(),
      react(),
      mode === "development" && componentTagger(),
      ...electronPlugins,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
