import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { ModuleManager } from "../managers/ModulesManager.js";

export function createStaticPanelsRouter(modulesManager: ModuleManager): Router {
  const router = Router();


  /**
   * Middleware to check if an module exists
   */
  const checkModuleExists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { moduleId } = req.params;
    const module = modulesManager.getModule(moduleId);

    if (!module) {
      console.log(`Module not found: ${moduleId}`);
      return res.status(404).json({
        error: "Module not found",
        message: `Module with ID "${moduleId}" does not exist`,
      });
    }

    console.log(`Module found: ${moduleId}`);
    req.module = module;
    next();
  };


  router.use(
    "/:moduleId/panel/content.js", // tmp to make it work with browser
    // "modules/:moduleId/left"
    checkModuleExists,
    async (req: Request, res: Response, next: NextFunction) => {
      const { moduleId } = req.params;
      const panelPath = modulesManager.getPanelPath(moduleId, "left");

      if (!panelPath) {
        return res.status(404).json({
          error: "Left panel not found",
          message: `Module "${moduleId}" does not have a left panel`,
        });
      }

      const bundlePath = path.join(panelPath, "bundle.js");
      try {
        await fs.access(bundlePath);
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(bundlePath, (err) => {
          if (err) {
            console.error(`Error sending bundle.js for module ${moduleId}:`, err);
            return res.status(500).json({
              error: "Server error",
              message: "Failed to serve bundle.js file",
            });
          }
        });
      } catch {
        res.status(404).json({
          error: "File not found",
          message: "bundle.js file does not exist",
        });
      }
    }
  );

  router.use(
    "/:moduleId/chat/content.js", // tmp to make it work with browser
    // "/modules/:moduleId/right",
    checkModuleExists,
    async (req: Request, res: Response, next: NextFunction) => {
      const { moduleId } = req.params;
      const panelPath = modulesManager.getPanelPath(moduleId, "right");

      if (!panelPath) {
        return res.status(404).json({
          error: "Right panel not found",
          message: `Module "${moduleId}" does not have a right panel`,
        });
      }

      const bundlePath = path.join(panelPath, "bundle.js");
      try {
        await fs.access(bundlePath);
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(bundlePath, (err) => {
          if (err) {
            console.error(`Error sending bundle.js for module ${moduleId}:`, err);
            return res.status(500).json({
              error: "Server error",
              message: "Failed to serve bundle.js file",
            });
          }
        });
      } catch {
        res.status(404).json({
          error: "File not found",
          message: "bundle.js file does not exist",
        });
      }
    }
  );
 

  return router;
}

// Extend Express types to add  module
declare global {
  namespace Express {
    interface Request {
      module?: import("../types/module.js").Module;
    }
  }
}
