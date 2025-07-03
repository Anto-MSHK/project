import { Router, Request, Response, NextFunction } from "express";
import {
  insertDoc,
  findDocs,
  findDocById,
  updateDocById,
  removeDocById,
} from "../db";
import { ModuleManager } from "../managers/ModulesManager";

/**
 * Generic multi-collection data router.
 *
 *   POST   /:moduleId/:collection          – create
 *   GET    /:moduleId/:collection          – list (optional filter)
 *   GET    /:moduleId/:collection/:id      – read
 *   PUT    /:moduleId/:collection/:id      – update
 *   DELETE /:moduleId/:collection/:id      – delete
 */
export function createModuleDataRouter(
  moduleManager: ModuleManager
): Router {
  const router = Router();

  // --- Helper: ensure module exists ---------------------------------------
  const checkModuleExists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { moduleId } = req.params;
    const module = moduleManager.getModule(moduleId);
    if (!module) {
      return res.status(404).json({
        error: "Module not found",
        message: `Module with ID \"${moduleId}\" does not exist`,
      });
    }
    req.module = module; // make available downstream
    next();
  };

  // ----------------------- CREATE -----------------------------------------
  router.post(
    "/:moduleId/:collection",
    checkModuleExists,
    async (req: Request, res: Response) => {
      try {
        const { moduleId, collection } = req.params;
        const payload = req.body ?? {};
        const _id = await insertDoc(collection, moduleId, payload);
        res.status(201).json({ _id, ...payload });
      } catch (err) {
        console.error("Failed to insert data:", err);
        res.status(500).json({ error: "Failed to insert data" });
      }
    }
  );

  // ----------------------- LIST ------------------------------------------
  router.get(
    "/:moduleId/:collection",
    checkModuleExists,
    async (req: Request, res: Response) => {
      try {
        const { moduleId, collection } = req.params;
        // Accept optional JSON stringified "filter" query parameter
        let extraFilter: Record<string, any> = {};
        if (typeof req.query.filter === "string") {
          try {
            extraFilter = JSON.parse(req.query.filter);
          } catch {
            return res.status(400).json({ error: "Invalid filter JSON" });
          }
        }
        const docs = await findDocs(collection, moduleId, extraFilter);
        res.json(docs);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        res.status(500).json({ error: "Failed to fetch data" });
      }
    }
  );

  // ----------------------- READ -------------------------------------------
  router.get(
    "/:moduleId/:collection/:id",
    checkModuleExists,
    async (req: Request, res: Response) => {
      try {
        const { moduleId, collection, id } = req.params as {
          moduleId: string;
          collection: string;
          id: string;
        };
        const doc = await findDocById(collection, moduleId, id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
      } catch (err) {
        console.error("Failed to fetch document:", err);
        res.status(500).json({ error: "Failed to fetch document" });
      }
    }
  );

  // ----------------------- UPDATE -----------------------------------------
  router.put(
    "/:moduleId/:collection/:id",
    checkModuleExists,
    async (req: Request, res: Response) => {
      try {
        const { moduleId, collection, id } = req.params as {
          moduleId: string;
          collection: string;
          id: string;
        };
        const update = req.body ?? {};
        const n = await updateDocById(collection, moduleId, id, update);
        res.json({ updated: n > 0 });
      } catch (err) {
        console.error("Failed to update document:", err);
        res.status(500).json({ error: "Failed to update document" });
      }
    }
  );

  // ----------------------- DELETE -----------------------------------------
  router.delete(
    "/:moduleId/:collection/:id",
    checkModuleExists,
    async (req: Request, res: Response) => {
      try {
        const { moduleId, collection, id } = req.params as {
          moduleId: string;
          collection: string;
          id: string;
        };
        const n = await removeDocById(collection, moduleId, id);
        res.json({ deleted: n > 0 });
      } catch (err) {
        console.error("Failed to delete document:", err);
        res.status(500).json({ error: "Failed to delete document" });
      }
    }
  );

  return router;
}

// Extend Express Request type to include `module` like in static-panels route
declare global {
  namespace Express {
    interface Request {
      module?: import("../types/module").Module;
    }
  }
} 