// vite.config.ts
import { defineConfig } from "file:///C:/Users/XSTER/dyad-apps/gatewaypagamento/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/XSTER/dyad-apps/gatewaypagamento/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";

// vite-api-plugin.ts
import { loadEnv } from "file:///C:/Users/XSTER/dyad-apps/gatewaypagamento/node_modules/vite/dist/node/index.js";
function apiPlugin() {
  return {
    name: "api-plugin",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/mercadopago_create_pix") {
          return next();
        }
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        console.log("\u{1F3AF} [DEV] Interceptando requisi\xE7\xE3o para /api/mercadopago_create_pix");
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          try {
            const { amount, description, transactionId } = JSON.parse(body);
            const token = env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
            console.log("\u{1F511} [DEV] Token encontrado:", token ? `${token.substring(0, 20)}...` : "N\xC3O CONFIGURADO");
            if (!token) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                success: false,
                error: "Token n\xE3o configurado"
              }));
              return;
            }
            const mpBody = {
              transaction_amount: amount,
              description,
              payment_method_id: "pix",
              payer: {
                email: "cliente@dimpay.com.br"
              },
              external_reference: transactionId
              // notification_url removido em dev - Mercado Pago não aceita localhost
              // Em produção, o endpoint serverless usa a URL correta
            };
            console.log("\u{1F680} [DEV] Criando PIX no Mercado Pago:", mpBody);
            const response = await fetch("https://api.mercadopago.com/v1/payments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-Idempotency-Key": transactionId
              },
              body: JSON.stringify(mpBody)
            });
            const data = await response.json();
            console.log("\u{1F4E1} [DEV] Resposta Mercado Pago:", {
              status: response.status,
              id: data.id,
              statusDetail: data.status_detail
            });
            if (!response.ok) {
              console.error("\u274C [DEV] Erro completo:", JSON.stringify(data, null, 2));
              let errorMsg = "Erro ao criar pagamento";
              if (data.message) {
                errorMsg = data.message;
              } else if (data.cause && data.cause.length > 0) {
                errorMsg = data.cause.map((c) => c.description || c.code).join(", ");
              }
              res.statusCode = response.status;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                success: false,
                error: errorMsg,
                details: data
              }));
              return;
            }
            const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
            const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
            const expiresAt = data.date_of_expiration;
            console.log("\u{1F50D} [DEV] Verificando QR Code:", {
              hasPointOfInteraction: !!data.point_of_interaction,
              hasTransactionData: !!data.point_of_interaction?.transaction_data,
              hasQrCode: !!qrCode,
              hasQrCodeBase64: !!qrCodeBase64,
              fullData: JSON.stringify(data, null, 2)
            });
            if (!qrCode) {
              console.error("\u274C [DEV] QR Code n\xE3o encontrado na resposta!");
              console.error("\u{1F4C4} [DEV] Estrutura completa:", JSON.stringify(data, null, 2));
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                success: false,
                error: "QR Code n\xE3o gerado pelo Mercado Pago",
                debug: {
                  paymentId: data.id,
                  status: data.status,
                  statusDetail: data.status_detail
                }
              }));
              return;
            }
            console.log("\u2705 [DEV] PIX criado com sucesso!");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: true,
              qr_code: qrCode,
              qr_code_base64: qrCodeBase64,
              id: String(data.id),
              expires_at: expiresAt
            }));
          } catch (error) {
            console.error("\u274C [DEV] Erro:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              success: false,
              error: error.message || "Erro interno"
            }));
          }
        });
      });
    }
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\XSTER\\dyad-apps\\gatewaypagamento";
var vite_config_default = defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom"]
  },
  server: {
    proxy: {
      "/api/resend": {
        target: "https://api.resend.com",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/resend/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const apiKey = process.env.VITE_RESEND_API_KEY;
            if (apiKey) {
              proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
            }
          });
        }
      }
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        return id === "react" || id === "react-dom" ? false : false;
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAidml0ZS1hcGktcGx1Z2luLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcWFNURVJcXFxcZHlhZC1hcHBzXFxcXGdhdGV3YXlwYWdhbWVudG9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFhTVEVSXFxcXGR5YWQtYXBwc1xcXFxnYXRld2F5cGFnYW1lbnRvXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9YU1RFUi9keWFkLWFwcHMvZ2F0ZXdheXBhZ2FtZW50by92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgYXBpUGx1Z2luIH0gZnJvbSAnLi92aXRlLWFwaS1wbHVnaW4nXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpUGx1Z2luKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpL3Jlc2VuZCc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkucmVzZW5kLmNvbScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL3Jlc2VuZC8sICcnKSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHkpID0+IHtcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEpID0+IHtcbiAgICAgICAgICAgIC8vIEFkaWNpb25hciBBUEkgS2V5IG5vIGhlYWRlclxuICAgICAgICAgICAgY29uc3QgYXBpS2V5ID0gcHJvY2Vzcy5lbnYuVklURV9SRVNFTkRfQVBJX0tFWVxuICAgICAgICAgICAgaWYgKGFwaUtleSkge1xuICAgICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXBpS2V5fWApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogKGlkKSA9PiB7XG4gICAgICAgIC8vIEV2aXRhciBtXHUwMEZBbHRpcGxhcyBjXHUwMEYzcGlhcyBkbyBSZWFjdFxuICAgICAgICByZXR1cm4gaWQgPT09ICdyZWFjdCcgfHwgaWQgPT09ICdyZWFjdC1kb20nID8gZmFsc2UgOiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxufSkiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFhTVEVSXFxcXGR5YWQtYXBwc1xcXFxnYXRld2F5cGFnYW1lbnRvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxYU1RFUlxcXFxkeWFkLWFwcHNcXFxcZ2F0ZXdheXBhZ2FtZW50b1xcXFx2aXRlLWFwaS1wbHVnaW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1hTVEVSL2R5YWQtYXBwcy9nYXRld2F5cGFnYW1lbnRvL3ZpdGUtYXBpLXBsdWdpbi50c1wiO2ltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuXG5leHBvcnQgZnVuY3Rpb24gYXBpUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2FwaS1wbHVnaW4nLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIC8vIENhcnJlZ2FyIHZhcmlcdTAwRTF2ZWlzIGRlIGFtYmllbnRlXG4gICAgICBjb25zdCBlbnYgPSBsb2FkRW52KHNlcnZlci5jb25maWcubW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpXG4gICAgICBcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIC8vIFZlcmlmaWNhciBzZSBcdTAwRTkgYSByb3RhIGNvcnJldGFcbiAgICAgICAgaWYgKHJlcS51cmwgIT09ICcvYXBpL21lcmNhZG9wYWdvX2NyZWF0ZV9waXgnKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnXHVEODNDXHVERkFGIFtERVZdIEludGVyY2VwdGFuZG8gcmVxdWlzaVx1MDBFN1x1MDBFM28gcGFyYSAvYXBpL21lcmNhZG9wYWdvX2NyZWF0ZV9waXgnKVxuXG4gICAgICAgIGxldCBib2R5ID0gJydcbiAgICAgICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGFtb3VudCwgZGVzY3JpcHRpb24sIHRyYW5zYWN0aW9uSWQgfSA9IEpTT04ucGFyc2UoYm9keSlcblxuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBlbnYuVklURV9NRVJDQURPX1BBR09fQUNDRVNTX1RPS0VOXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMTEgW0RFVl0gVG9rZW4gZW5jb250cmFkbzonLCB0b2tlbiA/IGAke3Rva2VuLnN1YnN0cmluZygwLCAyMCl9Li4uYCA6ICdOXHUwMEMzTyBDT05GSUdVUkFETycpXG5cbiAgICAgICAgICAgIGlmICghdG9rZW4pIHtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgICAgICAgIGVycm9yOiAnVG9rZW4gblx1MDBFM28gY29uZmlndXJhZG8nIFxuICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1wQm9keSA9IHtcbiAgICAgICAgICAgICAgdHJhbnNhY3Rpb25fYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgcGF5bWVudF9tZXRob2RfaWQ6ICdwaXgnLFxuICAgICAgICAgICAgICBwYXllcjoge1xuICAgICAgICAgICAgICAgIGVtYWlsOiAnY2xpZW50ZUBkaW1wYXkuY29tLmJyJ1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBleHRlcm5hbF9yZWZlcmVuY2U6IHRyYW5zYWN0aW9uSWRcbiAgICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uX3VybCByZW1vdmlkbyBlbSBkZXYgLSBNZXJjYWRvIFBhZ28gblx1MDBFM28gYWNlaXRhIGxvY2FsaG9zdFxuICAgICAgICAgICAgICAvLyBFbSBwcm9kdVx1MDBFN1x1MDBFM28sIG8gZW5kcG9pbnQgc2VydmVybGVzcyB1c2EgYSBVUkwgY29ycmV0YVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERTgwIFtERVZdIENyaWFuZG8gUElYIG5vIE1lcmNhZG8gUGFnbzonLCBtcEJvZHkpXG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLm1lcmNhZG9wYWdvLmNvbS92MS9wYXltZW50cycsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgICAgICAgICAgJ1gtSWRlbXBvdGVuY3ktS2V5JzogdHJhbnNhY3Rpb25JZFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShtcEJvZHkpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURDRTEgW0RFVl0gUmVzcG9zdGEgTWVyY2FkbyBQYWdvOicsIHtcbiAgICAgICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgICAgICBzdGF0dXNEZXRhaWw6IGRhdGEuc3RhdHVzX2RldGFpbFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgW0RFVl0gRXJybyBjb21wbGV0bzonLCBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSlcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGxldCBlcnJvck1zZyA9ICdFcnJvIGFvIGNyaWFyIHBhZ2FtZW50bydcbiAgICAgICAgICAgICAgaWYgKGRhdGEubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGVycm9yTXNnID0gZGF0YS5tZXNzYWdlXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5jYXVzZSAmJiBkYXRhLmNhdXNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBlcnJvck1zZyA9IGRhdGEuY2F1c2UubWFwKChjOiBhbnkpID0+IGMuZGVzY3JpcHRpb24gfHwgYy5jb2RlKS5qb2luKCcsICcpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gcmVzcG9uc2Uuc3RhdHVzXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yTXNnLFxuICAgICAgICAgICAgICAgIGRldGFpbHM6IGRhdGFcbiAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBxckNvZGUgPSBkYXRhLnBvaW50X29mX2ludGVyYWN0aW9uPy50cmFuc2FjdGlvbl9kYXRhPy5xcl9jb2RlXG4gICAgICAgICAgICBjb25zdCBxckNvZGVCYXNlNjQgPSBkYXRhLnBvaW50X29mX2ludGVyYWN0aW9uPy50cmFuc2FjdGlvbl9kYXRhPy5xcl9jb2RlX2Jhc2U2NFxuICAgICAgICAgICAgY29uc3QgZXhwaXJlc0F0ID0gZGF0YS5kYXRlX29mX2V4cGlyYXRpb25cblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQwRCBbREVWXSBWZXJpZmljYW5kbyBRUiBDb2RlOicsIHtcbiAgICAgICAgICAgICAgaGFzUG9pbnRPZkludGVyYWN0aW9uOiAhIWRhdGEucG9pbnRfb2ZfaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgIGhhc1RyYW5zYWN0aW9uRGF0YTogISFkYXRhLnBvaW50X29mX2ludGVyYWN0aW9uPy50cmFuc2FjdGlvbl9kYXRhLFxuICAgICAgICAgICAgICBoYXNRckNvZGU6ICEhcXJDb2RlLFxuICAgICAgICAgICAgICBoYXNRckNvZGVCYXNlNjQ6ICEhcXJDb2RlQmFzZTY0LFxuICAgICAgICAgICAgICBmdWxsRGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMilcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmICghcXJDb2RlKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBbREVWXSBRUiBDb2RlIG5cdTAwRTNvIGVuY29udHJhZG8gbmEgcmVzcG9zdGEhJylcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHVEODNEXHVEQ0M0IFtERVZdIEVzdHJ1dHVyYSBjb21wbGV0YTonLCBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSlcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogJ1FSIENvZGUgblx1MDBFM28gZ2VyYWRvIHBlbG8gTWVyY2FkbyBQYWdvJyxcbiAgICAgICAgICAgICAgICBkZWJ1Zzoge1xuICAgICAgICAgICAgICAgICAgcGF5bWVudElkOiBkYXRhLmlkLFxuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgIHN0YXR1c0RldGFpbDogZGF0YS5zdGF0dXNfZGV0YWlsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgW0RFVl0gUElYIGNyaWFkbyBjb20gc3VjZXNzbyEnKVxuXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgIHFyX2NvZGU6IHFyQ29kZSxcbiAgICAgICAgICAgICAgcXJfY29kZV9iYXNlNjQ6IHFyQ29kZUJhc2U2NCxcbiAgICAgICAgICAgICAgaWQ6IFN0cmluZyhkYXRhLmlkKSxcbiAgICAgICAgICAgICAgZXhwaXJlc19hdDogZXhwaXJlc0F0XG4gICAgICAgICAgICB9KSlcblxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBbREVWXSBFcnJvOicsIGVycm9yKVxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0Vycm8gaW50ZXJubydcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVULFNBQVMsb0JBQW9CO0FBQ3BWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7OztBQ0RqQixTQUFTLGVBQWU7QUFFakIsU0FBUyxZQUFvQjtBQUNsQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBUTtBQUV0QixZQUFNLE1BQU0sUUFBUSxPQUFPLE9BQU8sTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRXpELGFBQU8sWUFBWSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVM7QUFFL0MsWUFBSSxJQUFJLFFBQVEsK0JBQStCO0FBQzdDLGlCQUFPLEtBQUs7QUFBQSxRQUNkO0FBRUEsWUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixjQUFJLGFBQWE7QUFDakIsY0FBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsY0FBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8scUJBQXFCLENBQUMsQ0FBQztBQUN2RDtBQUFBLFFBQ0Y7QUFFQSxnQkFBUSxJQUFJLGlGQUFvRTtBQUVoRixZQUFJLE9BQU87QUFDWCxZQUFJLEdBQUcsUUFBUSxXQUFTO0FBQ3RCLGtC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
