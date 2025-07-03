import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { ModuleManager } from "../managers/ModulesManager";
import { getDefaulModulesDir } from "../utils/paths";

/**
 * Router for the secure file system API
 */
export function createFileSystemRouter(modulesManager: ModuleManager): Router {
  const router = Router();

  const modulesRootDir = getDefaulModulesDir();

  /**
   * Check agent permissions for file system access
   */
  const checkFileSystemPermission = (
    req: Request,
    res: Response,
    next: Function
  ) => {
    const moduleId = req.headers["x-module-id"] as string;

    if (!moduleId) {
      return res.status(400).json({
        error: "Module ID is missing",
        message: "X-Module-Id header is required",
      });
    }

    if (!modulesManager.checkPermission(moduleId, "fileSystem")) {
      return res.status(403).json({
        error: "Access denied",
        message: "Module does not have permission to access the file system",
      });
    }

    req.moduleId = moduleId;
    next();
  };

  /**
   * Resolve and validate a requested path.
   *
   * Supported forms:
   *   1. Relative paths within the process working directory – the previous behaviour.
   *   2. Absolute-like paths that start with "/modules/{moduleId}". These are resolved
   *      against the global modules directory returned by getDefaulModulesDir().
   *
   * In either case, attempts at directory traversal are rejected and the caller
   * is never allowed to escape the designated root.
   */
  const sanitizePath = (inputPath: string, moduleId: string): string | null => {
    try {
      // Always work with POSIX style for consistent checks
      const normalized = path.posix.normalize(inputPath.replace(/\\/g, "/"));

      // Reject obvious traversal attempts
      if (normalized.includes("..") || /^[a-zA-Z]:/.test(normalized)) {
        return null;
      }

      // ------------------------------------------------------------------
      // Case 1: /modules/{moduleId}/...
      // ------------------------------------------------------------------
      if (normalized.startsWith("/modules/")) {
        const parts = normalized.split("/").filter(Boolean); // ["modules", "{moduleId}", ...]
        if (parts.length < 2) return null;

        const requestedModuleId = parts[1];
        if (requestedModuleId !== moduleId) {
          return null; // cross-module access is forbidden
        }

        const relativeInsideModule = parts.slice(1).join(path.sep); // "{moduleId}/..."
        const absolute = path.resolve(modulesRootDir, relativeInsideModule);

        // Ensure the resolved path is still inside the modules root dir
        if (!absolute.startsWith(modulesRootDir)) {
          return null;
        }

        return absolute;
      }

      // ------------------------------------------------------------------
      // Case 2: legacy relative path (within process.cwd())
      // ------------------------------------------------------------------
      if (normalized.startsWith("/")) {
        return null; // any other absolute path is forbidden
      }

      const absolute = path.resolve(process.cwd(), normalized);
      if (!absolute.startsWith(process.cwd())) {
        return null;
      }

      return absolute;
    } catch {
      return null;
    }
  };

  /**
   * GET /api/fs/list
   * Get a list of files and folders in a directory
   */
  router.get(
    "/list",
    checkFileSystemPermission,
    async (req: Request, res: Response) => {
      try {
        const targetPath = (req.query.path as string) || ".";
        const safePath = sanitizePath(targetPath, req.moduleId as string);

        if (!safePath) {
          return res.status(400).json({
            error: "Invalid path",
            message:
              "The specified path contains invalid characters or goes beyond the allowed area",
          });
        }

        // Check if the directory exists
        const stat = await fs.stat(safePath);
        if (!stat.isDirectory()) {
          return res.status(400).json({
            error: "Is not a directory",
            message: "The specified path is not a directory",
          });
        }

        // Read the contents of the directory
        const entries = await fs.readdir(safePath, { withFileTypes: true });

        const items = await Promise.all(
          entries.map(async (entry) => {
            const itemPath = path.join(safePath, entry.name);
            const itemStat = await fs.stat(itemPath);

            return {
              name: entry.name,
              type: entry.isDirectory() ? "directory" : "file",
              size: entry.isFile() ? itemStat.size : null,
              modified: itemStat.mtime.toISOString(),
              path:
                itemPath.startsWith(modulesRootDir)
                  ? path.join(
                      "/modules",
                      path.relative(modulesRootDir, itemPath)
                    )
                  : path.relative(process.cwd(), itemPath),
            };
          })
        );

        res.json({
          path:
            safePath.startsWith(modulesRootDir)
              ? path.join("/modules", path.relative(modulesRootDir, safePath))
              : path.relative(process.cwd(), safePath),
          items,
        });
      } catch (error) {
        console.error("Error reading directory:", error);

        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return res.status(404).json({
            error: "Directory not found",
            message: "The specified directory does not exist",
          });
        }

        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to read directory contents",
        });
      }
    }
  );

  /**
   * POST /api/fs/read
   * Read file content
   */
  router.post(
    "/read",
    checkFileSystemPermission,
    async (req: Request, res: Response) => {
      try {
        const { path: filePath, encoding = "utf-8" } = req.body;

        if (!filePath) {
          return res.status(400).json({
            error: "File path is missing",
            message: "File path must be specified in the request body",
          });
        }

        const safePath = sanitizePath(filePath, req.moduleId as string);
        if (!safePath) {
          return res.status(400).json({
            error: "Invalid path",
            message:
              "The specified path contains invalid characters or goes beyond the allowed area",
          });
        }

        // Check if the file exists
        const stat = await fs.stat(safePath);
        if (!stat.isFile()) {
          return res.status(400).json({
            error: "Is not a file",
            message: "The specified path is not a file",
          });
        }

        // Limit file size (10MB)
        const maxFileSize = 10 * 1024 * 1024;
        if (stat.size > maxFileSize) {
          return res.status(413).json({
            error: "File is too large",
            message: "File size exceeds 10MB",
          });
        }

        // Read the file
        const content = await fs.readFile(safePath, encoding as BufferEncoding);

        res.json({
          path:
            safePath.startsWith(modulesRootDir)
              ? path.join("/modules", path.relative(modulesRootDir, safePath))
              : path.relative(process.cwd(), safePath),
          size: stat.size,
          modified: stat.mtime.toISOString(),
          encoding,
          content,
        });
      } catch (error) {
        console.error("Error reading file:", error);

        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return res.status(404).json({
            error: "File not found",
            message: "The specified file does not exist",
          });
        }

        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to read file",
        });
      }
    }
  );

  /**
   * POST /api/fs/write
   * Write content to a file (additional method for API completeness)
   */
  router.post(
    "/write",
    checkFileSystemPermission,
    async (req: Request, res: Response) => {
      try {
        const { path: filePath, content, encoding = "utf-8" } = req.body;

        if (!filePath || content === undefined) {
          return res.status(400).json({
            error: "Insufficient data",
            message: "File path and content must be specified",
          });
        }

        const safePath = sanitizePath(filePath, req.moduleId as string);
        if (!safePath) {
          return res.status(400).json({
            error: "Invalid path",
            message:
              "The specified path contains invalid characters or goes beyond the allowed area",
          });
        }

        // Create directory if it does not exist
        await fs.mkdir(path.dirname(safePath), { recursive: true });

        // Write the file
        await fs.writeFile(safePath, content, encoding as BufferEncoding);

        // Get information about the created file
        const stat = await fs.stat(safePath);

        res.json({
          success: true,
          path:
            safePath.startsWith(modulesRootDir)
              ? path.join("/modules", path.relative(modulesRootDir, safePath))
              : path.relative(process.cwd(), safePath),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      } catch (error) {
        console.error("Error writing file:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to write file",
        });
      }
    }
  );

  return router;
}

// Extend Express types to add moduleId
declare global {
  namespace Express {
    interface Request {
      moduleId?: string;
    }
  }
}
