import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Evita que o Turbopack suba até um yarn.lock solto em ~/ e trate a home
    // inteira como raiz do projeto (causava recompilações contínuas/flicker).
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
