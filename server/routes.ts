import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get character movement path
  app.get("/api/movement-path", (req, res) => {
    // Return a random movement path for the character
    const paths = [
      { direction: "right", distance: 300, hasObstacle: false },
      { direction: "right", distance: 200, hasObstacle: true },
      { direction: "right", distance: 400, hasObstacle: false },
      { direction: "right", distance: 150, hasObstacle: true },
      { direction: "right", distance: 500, hasObstacle: false },
    ];
    
    const randomPath = paths[Math.floor(Math.random() * paths.length)];
    res.json(randomPath);
  });

  const httpServer = createServer(app);

  return httpServer;
}
