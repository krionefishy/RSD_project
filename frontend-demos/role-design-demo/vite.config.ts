import path from "path";
import { defineConfig } from "../../frontend/node_modules/vite/dist/node/index.js";
import react from "../../frontend/node_modules/@vitejs/plugin-react/dist/index.js";

const frontendNodeModules = path.resolve(__dirname, "../../frontend/node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.join(frontendNodeModules, "react"),
      "react-dom": path.join(frontendNodeModules, "react-dom"),
      "react/jsx-runtime": path.join(frontendNodeModules, "react/jsx-runtime.js"),
      "lucide-react": path.join(frontendNodeModules, "lucide-react"),
    },
  },
});
