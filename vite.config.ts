import { defineConfig } from "vite"
import tsConfigPaths from "vite-tsconfig-paths"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  server: { port: 3000 },
  define: {
    "process.env.TSS_PRERENDERING": JSON.stringify(""),
    "process.env.TSS_SHELL": JSON.stringify(""),
  },
  esbuild: {
    logOverride: {
      "ignored-bare-import": "silent",
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})
