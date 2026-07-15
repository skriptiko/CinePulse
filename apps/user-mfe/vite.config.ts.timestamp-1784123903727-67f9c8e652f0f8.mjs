// vite.config.ts
import { resolve } from "node:path";
import { federation } from "file:///vercel/share/v0-project/node_modules/.pnpm/@module-federation+vite@1.11.0_rollup@4.57.1_typescript@5.9.3_vite@5.4.21_@types+node@20.19.30_lightningcss@1.32.0_/node_modules/@module-federation/vite/lib/index.cjs";
import react from "file:///vercel/share/v0-project/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.30_lightningcss@1.32.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///vercel/share/v0-project/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.30_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/vercel/share/v0-project/apps/user-mfe";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    federation({
      name: "userMfe",
      filename: "remoteEntry.js",
      exposes: {
        "./routes": "./src/routes.tsx"
      },
      shared: {
        react: {
          requiredVersion: "^18.3.1"
        },
        "react-dom": {
          requiredVersion: "^18.3.1"
        },
        "react-router-dom": {},
        "@repo/events": {},
        "@repo/routes": {},
        "@repo/api": {},
        "@tanstack/react-query": {}
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    modulePreload: false,
    target: "chrome89",
    minify: false,
    cssCodeSplit: false
  },
  server: {
    port: 5002,
    strictPort: true,
    cors: true,
    origin: "http://localhost:5002"
  },
  preview: {
    port: 5002,
    strictPort: true,
    cors: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmVyY2VsL3NoYXJlL3YwLXByb2plY3QvYXBwcy91c2VyLW1mZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3ZlcmNlbC9zaGFyZS92MC1wcm9qZWN0L2FwcHMvdXNlci1tZmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3ZlcmNlbC9zaGFyZS92MC1wcm9qZWN0L2FwcHMvdXNlci1tZmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZlZGVyYXRpb24gfSBmcm9tICdAbW9kdWxlLWZlZGVyYXRpb24vdml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIGZlZGVyYXRpb24oe1xuICAgICAgbmFtZTogJ3VzZXJNZmUnLFxuICAgICAgZmlsZW5hbWU6ICdyZW1vdGVFbnRyeS5qcycsXG4gICAgICBleHBvc2VzOiB7XG4gICAgICAgICcuL3JvdXRlcyc6ICcuL3NyYy9yb3V0ZXMudHN4JyxcbiAgICAgIH0sXG4gICAgICBzaGFyZWQ6IHtcbiAgICAgICAgcmVhY3Q6IHtcbiAgICAgICAgICByZXF1aXJlZFZlcnNpb246ICdeMTguMy4xJyxcbiAgICAgICAgfSxcbiAgICAgICAgJ3JlYWN0LWRvbSc6IHtcbiAgICAgICAgICByZXF1aXJlZFZlcnNpb246ICdeMTguMy4xJyxcbiAgICAgICAgfSxcbiAgICAgICAgJ3JlYWN0LXJvdXRlci1kb20nOiB7fSxcbiAgICAgICAgJ0ByZXBvL2V2ZW50cyc6IHt9LFxuICAgICAgICAnQHJlcG8vcm91dGVzJzoge30sXG4gICAgICAgICdAcmVwby9hcGknOiB7fSxcbiAgICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSc6IHt9LFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG1vZHVsZVByZWxvYWQ6IGZhbHNlLFxuICAgIHRhcmdldDogJ2Nocm9tZTg5JyxcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIGNzc0NvZGVTcGxpdDogZmFsc2UsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUwMDIsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlLFxuICAgIG9yaWdpbjogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMicsXG4gIH0sXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA1MDAyLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgY29yczogdHJ1ZSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUyxTQUFTLGVBQWU7QUFDNVQsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBSDdCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFdBQVc7QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxRQUNQLFlBQVk7QUFBQSxNQUNkO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixPQUFPO0FBQUEsVUFDTCxpQkFBaUI7QUFBQSxRQUNuQjtBQUFBLFFBQ0EsYUFBYTtBQUFBLFVBQ1gsaUJBQWlCO0FBQUEsUUFDbkI7QUFBQSxRQUNBLG9CQUFvQixDQUFDO0FBQUEsUUFDckIsZ0JBQWdCLENBQUM7QUFBQSxRQUNqQixnQkFBZ0IsQ0FBQztBQUFBLFFBQ2pCLGFBQWEsQ0FBQztBQUFBLFFBQ2QseUJBQXlCLENBQUM7QUFBQSxNQUM1QjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsSUFDZixRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
