import fs from "fs/promises";
import path from "path";
import { Module, ModuleManifest } from "../types/module";
import { getDefaulModulesDir } from "../utils/paths";

export class ModuleManager {
  private modules: Map<string, Module> = new Map();
  private modulesDir: string;

  constructor(modulesDir: string = getDefaulModulesDir()) {
    this.modulesDir = modulesDir;
  }

  async initialize(): Promise<void> {
    console.log(
      `Initializing ModulesManager, scanning directory: ${this.modulesDir}`
    );

    try {
      await fs.mkdir(this.modulesDir, { recursive: true });

      await this.scanModules();

      console.log(
        `ModulesManager initialized. Modules found: ${this.modules.size}`
      );
    } catch (error) {
      console.error("Error initializing ModulesManager:", error);
      throw error;
    }
  }

  /**
   * Scans the modules directory.
   */
  private async scanModules(): Promise<void> {
    try {
      const entries = await fs.readdir(this.modulesDir, { withFileTypes: true });
      console.log("this.modulesDir", this.modulesDir);
      // Looking for directories only
      const moduleDirs = entries.filter((entry) => entry.isDirectory());
      console.log("moduleDirs", moduleDirs);

      // Processing each module directory
      await Promise.allSettled(
        moduleDirs.map((dir) => this.loadModule(dir.name))
      );
    } catch (error) {
      console.error("Error scanning modules directory:", error);
    }
  }

  /**
   * Loads a single module.
   */
  private async loadModule(moduleId: string): Promise<void> {
    const modulePath = path.join(this.modulesDir, moduleId);
    const manifestPath = path.join(modulePath, "manifest.json");

    try {
      // Checking for manifest.json existence
      await fs.access(manifestPath);

      // Reading and parsing manifest
      const manifestContent = await fs.readFile(manifestPath, "utf-8");
      const manifest: ModuleManifest = JSON.parse(manifestContent);

      // Validating mandatory manifest fields
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error(
          "Invalid manifest: missing required fields (id, name, version)"
        );
      }

      // Checking for panel directories existence
      const leftPanelPath = path.join(modulePath, "left_panel");
      const rightPanelPath = path.join(modulePath, "right_panel");

      const leftPanelExists = await this.directoryExists(leftPanelPath);
      const rightPanelExists = await this.directoryExists(rightPanelPath);

      // Creating module object
      const module: Module = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || "",
        author: manifest.author || "",
        permissions: manifest.permissions || {},
        manifest,
        panels: {
          left: leftPanelExists,
          right: rightPanelExists,
        },
      };

      // Registering the module
      this.modules.set(moduleId, module);
      console.log(
        `Module loaded: ${module.name} (${module.id}) v${module.version}`
      );
    } catch (error) {
      console.error(`Error loading module ${moduleId}:`, error);
    }
  }

  /**
   * Checks if a directory exists.
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Gets a list of all modules.
   */
  getModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Gets a module by ID.
   */
  getModule(id: string): Module | undefined {
    return this.modules.get(id);
  }

  /**
   * Checks module permissions.
   */
  checkPermission(
    moduleId: string,
    permission: keyof ModuleManifest["permissions"]
  ): boolean {
    const module = this.getModule(moduleId);
    if (!module) {
      return false;
    }

    return module.permissions[permission] === true;
  }


  getPanelPath(moduleId: string, panel: "left" | "right"): string | null {
    const module = this.getModule(moduleId);
    if (!module) {
      return null;
    }
    const baseDir = path.join(this.modulesDir, module.id);
    const panelDir = panel === "left" ? "left_panel" : "right_panel";
    const panelPath = path.join(baseDir, panelDir);

    return module.panels[panel] ? panelPath : null;
  }

  /**
   * Reloads modules (for hot-reloading).
   */
  async reload(): Promise<void> {
    this.modules.clear();
    await this.scanModules();
  }
}

