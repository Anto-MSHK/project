import path from "path";
import os from "os";

/**
 * Get a safe app data directory that works with Unicode usernames on Windows
 */
export function getAppDataDir(): string {
  const platform = os.platform();

  switch (platform) {
    case "win32":
      const tempDir = os.tmpdir();
      const userDir = path.dirname(path.dirname(path.dirname(tempDir)));
      return userDir;

    case "darwin":
      return os.homedir();

    case "linux":
      return process.env.HOME || os.homedir();

    default:
      return os.homedir();
  }
}

/**
 * Get the WizeServer www directory
 */
export function getWizeWwwDir(): string {
  const platform = os.platform();
  const baseDir = getAppDataDir();

  switch (platform) {
    case "win32":
      return path.join(baseDir, "www");

    case "darwin":
      // On macOS, use ~/Documents/www for better UX
      return path.join(baseDir, "Documents", "www");

    case "linux":
      // On Linux, use ~/.local/share/www (XDG Base Directory spec)
      return path.join(baseDir, ".local", "share", "www");

    default:
      return path.join(baseDir, "www");
  }
}

/**
 * Get the WizeServer modules directory
 */
export function getDefaulModulesDir(): string {
  const platform = os.platform();
  const baseDir = getAppDataDir();
  console.log("baseDir", baseDir);

  switch (platform) {
    case "win32":
      return path.join(baseDir, "modules");

    case "darwin":
      return path.join(baseDir, "Documents", "modules");

    case "linux":
      return path.join(baseDir, ".local", "share", "modules");

    default:
      return path.join(baseDir, "modules");
  }
}

/**
 * Get the WizeServer database directory
 */
export function getWizeDbDir(): string {
  const platform = os.platform();
  const baseDir = getAppDataDir();

  switch (platform) {
    case "win32":
      return path.join(baseDir, "www", "data");

    case "darwin":
      return path.join(baseDir, "Documents", "www", "data");

    case "linux":
      return path.join(baseDir, ".local", "share", "www", "data");

    default:
      return path.join(baseDir, "www", "data");
  }
}
