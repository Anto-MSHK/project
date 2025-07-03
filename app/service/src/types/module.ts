/**
 * Module permissions for accessing system resources
 */
export interface ModulePermissions {
  /** Access to the file system */
  fileSystem?: boolean;
  /** Access to the API proxy for external requests */
  apiProxy?: boolean;
  /** Access to the LLM API */
  llm?: boolean;
  /** Additional permissions */
  [key: string]: boolean | undefined;
}

/**
 * Module manifest - manifest.json file
 */
export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: ModulePermissions;
  metadata?: Record<string, any>;
}

/**
 * Information about module panels
 */
export interface ModulePanels {
  /** Availability of the left panel */
  left: boolean;
  /** Availability of the right panel */
  right: boolean;
}

/**
 * Module object with full information
 */
export interface Module {
  /** Module ID */
  id: string;
  /** Module name */
  name: string;
  /** Module version */
  version: string;
  /** Module description */
  description: string;
  /** Module author */
  author: string;
  /** Module permissions */
  permissions: ModulePermissions;
  /** Path to the module directory */
  // path: string;
  /** Full module manifest */
  manifest: ModuleManifest;
  /** Information about panels */
  panels: ModulePanels;
}

export interface ModuleListResponse {
  /** List of modules */
  modules: Module[];
  /** Total number of modules */
  total: number;
}
