import express, { type Request, Response, NextFunction } from "express";
import session from "express-session"; // Importa o express-session
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';

dotenv.config(); // Carrega as variáveis de ambiente

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Adiciona o middleware de sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret", // Utilize uma variável de ambiente em produção
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production", // true se estiver em produção com HTTPS
    },
  })
);

// Middleware de log para as rotas /api
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Middleware global de tratamento de erro
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error, Middleware global de tratamento de erro";
    res.status(status).json({ message });
    throw err;
  });

  // Configuração do Vite em desenvolvimento; caso contrário, servir os arquivos estáticos
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Define a porta a partir da variável de ambiente ou usa 5000 por padrão
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const startServer = (retryPort = port) => {
    server
      .listen(
        {
          port: retryPort,
          host: "127.0.0.1",
        },
        () => {
          log(`serving on port ${retryPort}`);
        }
      )
      .on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          log(`Port ${retryPort} is already in use, trying ${retryPort + 1}`);
          startServer(retryPort + 1);
        } else {
          console.error("Server error:", err);
        }
      });
  };

  startServer();
})();
