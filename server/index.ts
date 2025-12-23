import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const isDevelopment = process.env.NODE_ENV === "development";

(async () => {
  const server = await registerRoutes(app);

  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT || 5000);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
