import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import legacy from "@vitejs/plugin-legacy";

const isApkPreview = process.env.OOTD_APK_PREVIEW === "1";

// https://vitejs.dev/config/
export default defineConfig({
  base: isApkPreview ? "./" : "/",
  plugins: [
    uni(),
    ...(isApkPreview
      ? [legacy({
          targets: ["Chrome >= 60", "Android >= 4.4"],
          modernPolyfills: true,
          renderLegacyChunks: true,
        })]
      : []),
  ],
});
