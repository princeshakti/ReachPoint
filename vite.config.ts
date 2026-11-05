import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  // Vite only exposes VITE_* variables to the app. Server functions read the
  // Google key from process.env, so copy it over from .env during development.
  const env = loadEnv(mode, process.cwd(), "");
  for (const name of ["GOOGLE_MAPS_API_KEY", "GOOGLE_MAPS_BROWSER_KEY"]) {
    const value = env[name];
    if (value && !process.env[name]) process.env[name] = value;
  }

  return {
    server: { port: 5173 },
    resolve: {
      dedupe: ["react", "react-dom", "@tanstack/react-query"],
    },
    plugins: [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart(),
      // Nitro produces the deployable server in .output/ and is only needed for builds.
      ...(command === "build" ? [nitro()] : []),
      viteReact(),
    ],
  };
});
