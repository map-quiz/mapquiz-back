import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import "dotenv/config";
import Fastify from "fastify";
import { prisma } from "./lib/database.js";
import { errorHandler } from "./lib/errorHandler.js";
import { apiRoutes } from "./routes/index.js";
import { setupWebSocketHandlers } from "./websocket/index.js";

/**
 * Configuration optimisée du serveur Fastify
 */
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  },
  trustProxy: true,
  keepAliveTimeout: 5000,
  maxParamLength: 200,
});

/**
 * Configuration des plugins de sécurité et middleware
 */
async function setupPlugins() {
  // Plugin de sécurité Helmet
  await fastify.register(helmet);

  // Configuration CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  // Limitation de débit - Configuration différente selon l'environnement
  if (process.env.NODE_ENV === "test") {
    // Configuration très permissive pour les tests
    await fastify.register(rateLimit, {
      max: 10000, // Très permissif pour les tests
      timeWindow: "1 minute",
      allowList: ["127.0.0.1", "::1", "localhost"],
      skipOnError: true,
    });
  } else if (process.env.NODE_ENV === "production") {
    // Configuration stricte pour la production
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
  } else {
    // Configuration permissive pour le développement
    await fastify.register(rateLimit, {
      max: 1000,
      timeWindow: "1 minute",
      allowList: ["127.0.0.1", "::1", "localhost"],
    });
  }

  // Plugin WebSocket
  await fastify.register(websocket);
}

/**
 * Configuration complète du serveur
 */
export const build = async () => {
  // Configuration des plugins de sécurité et middleware
  await setupPlugins();

  // Routes de base
  fastify.get("/", async (request, reply) => {
    return {
      message: "API Fastify + Prisma",
      version: "1.0.0",
      endpoints: {
        api: "/api",
        websocket: "/ws",
        health: "/health",
      },
    };
  });

  fastify.get("/health", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.status(503).send({
        status: "error",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Enregistrement de toutes les routes API avec préfixe
  await fastify.register(apiRoutes, { prefix: "/api" });

  // Configuration des WebSockets
  setupWebSocketHandlers(fastify);

  // Gestionnaire d'erreur global
  fastify.setErrorHandler(errorHandler);

  return fastify;
};

/**
 * Démarrage du serveur
 */
const start = async () => {
  try {
    const server = await build();

    // Optimisations des hooks
    server.addHook("onRequest", (req, reply, done) => {
      // Désactiver les logs verbeux pour WebSocket
      if (req.url === "/ws" && process.env.NODE_ENV === "production") {
        req.log.info = () => {};
        req.log.debug = () => {};
      }
      done();
    });

    // Hook de performance monitoring
    server.addHook("onResponse", (req, reply, done) => {
      done();
    });

    // Démarrer le serveur
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    console.log(`🚀 Serveur démarré sur http://${host}:${port}`);
  } catch (error) {
    console.error("Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Gestion gracieuse de l'arrêt
const gracefulShutdown = async (signal: string) => {
  console.log(`Signal ${signal} reçu, arrêt gracieux en cours...`);

  try {
    // Fermer les connexions WebSocket
    await fastify.close();

    // Fermer la base de données
    await prisma.$disconnect();

    console.log("Arrêt gracieux terminé");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'arrêt gracieux", { error });
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Gestion des erreurs non capturées
process.on("uncaughtException", (error: Error) => {
  console.error("Exception non capturée", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Lancement du serveur seulement si pas en mode test
if (process.env.NODE_ENV !== "test") {
  start();
}
