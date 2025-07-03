import path from 'path';
import Datastore from '@seald-io/nedb';
import { getDefaulModulesDir } from "./utils/paths";
import * as fs from "fs";

const homedir = require('os').homedir();
const dbFilePath = path.join(homedir, ".aicombiner", "database.db")

// Create the Datastore instance
const db = new Datastore({
  filename: dbFilePath,
  autoload: true,
  onload: (err) => {
    if (err) {
      console.error('Error during database autoload:', err);
    }
  }
});

db.on('compaction.done', () => {
  console.log('Database compaction completed successfully.');
});

export function addItem(name: string, url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    db.insert({ name, url, createdAt: new Date() }, (err: Error | null, newDoc: { _id: string }) => {
      if (err) {
        reject(err);
      } else {
        resolve(newDoc._id);
      }
    });
  });
}

export function getItems(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.find({}, (err: Error | null, docs: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
}

export function deleteItem(id: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.remove({ "_id": id }, (err: Error | null, n: number) => {
      if (err) {
        reject(err);
      } else {
        resolve(n);
      }
    });
  });
}

// ====================== Generic module-scoped helpers =====================

/**
 * Inserts an arbitrary document belonging to the given module.
 * The function automatically adds the `moduleId` and `createdAt` fields.
 *
 * @param moduleId Unique module identifier (required in every document)
 * @param data     Arbitrary JSON-serialisable payload to persist
 * @returns        Promise that resolves to newly created document _id
 */
export function insertData(
  moduleId: string,
  data: Record<string, any>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = {
      ...data,
      moduleId,
      createdAt: new Date(),
    };
    db.insert(doc, (err: Error | null, newDoc: { _id: string }) => {
      if (err) return reject(err);
      resolve(newDoc._id);
    });
  });
}

/**
 * Retrieves documents for a given module. Optional additional NeDB query
 * criteria can be provided to further filter the results.
 */
export function getData(
  moduleId: string,
  query: Record<string, any> = {}
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.find({ moduleId, ...query }, (err: Error | null, docs: any[]) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
}

/** Get single document by its _id ensuring it belongs to the module */
export function getDataById(
  moduleId: string,
  id: string
): Promise<any | null> {
  return new Promise((resolve, reject) => {
    db.findOne({ _id: id, moduleId }, (err: Error | null, doc: any | null) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

/**
 * Updates a document by its _id. Returns the number of affected documents.
 */
export function updateDataById(
  moduleId: string,
  id: string,
  update: Record<string, any>
): Promise<number> {
  return new Promise((resolve, reject) => {
    // Never allow changing _id or moduleId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, moduleId: _m, ...safeUpdate } = update;
    db.update(
      { _id: id, moduleId },
      { $set: { ...safeUpdate, updatedAt: new Date() } },
      {},
      (err: Error | null, num: number) => {
        if (err) return reject(err);
        resolve(num);
      }
    );
  });
}

/** Removes a document by its _id. Returns the number of removed docs. */
export function deleteDataById(
  moduleId: string,
  id: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.remove({ _id: id, moduleId }, {}, (err: Error | null, num: number) => {
      if (err) return reject(err);
      resolve(num);
    });
  });
}

export default db;

// ----------------------- Collection management ----------------------------

/** In-memory cache keyed by `${moduleId}:${collection}` to avoid reopening */
const collectionCache: Record<string, Datastore> = {};

function getCollectionDB(collection: string, moduleId: string): Datastore {
  if (collection === "default") return db; // backwards-compat

  const cacheKey = `${moduleId}:${collection}`;
  if (!collectionCache[cacheKey]) {
    const baseDir = path.join(getDefaulModulesDir(), moduleId, "data");
    // Ensure directory exists
    try {
      fs.mkdirSync(baseDir, { recursive: true });
    } catch (err) {
      console.error("Failed to create module data directory", err);
    }

    const filePath = path.join(baseDir, `${collection}.db`);
    collectionCache[cacheKey] = new Datastore({
      filename: filePath,
      autoload: true,
      onload: (err) => {
        if (err) console.error(`Error loading collection ${collection} (${moduleId}):`, err);
      },
    });

    collectionCache[cacheKey].on("compaction.done", () => {
      console.log(`Compaction done for ${moduleId}/${collection}`);
    });
  }
  return collectionCache[cacheKey];
}

// ----------------------- Generic helpers (multi-collection) ---------------

type CollectionName = string; // free-form; e.g. "sessions", "documents"

export function insertDoc(
  collection: CollectionName,
  moduleId: string,
  data: Record<string, any>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const store = getCollectionDB(collection, moduleId);
    const doc = {
      ...data,
      moduleId,
      createdAt: new Date(),
    };
    store.insert(doc, (err: Error | null, newDoc: { _id: string }) => {
      if (err) return reject(err);
      resolve(newDoc._id);
    });
  });
}

export function findDocs(
  collection: CollectionName,
  moduleId: string,
  query: Record<string, any> = {}
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const store = getCollectionDB(collection, moduleId);
    store.find({ moduleId, ...query }, (err: Error | null, docs: any[]) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
}

export function findDocById(
  collection: CollectionName,
  moduleId: string,
  id: string
): Promise<any | null> {
  return new Promise((resolve, reject) => {
    const store = getCollectionDB(collection, moduleId);
    store.findOne({ _id: id, moduleId }, (err: Error | null, doc: any | null) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });
}

export function updateDocById(
  collection: CollectionName,
  moduleId: string,
  id: string,
  update: Record<string, any>
): Promise<number> {
  return new Promise((resolve, reject) => {
    const store = getCollectionDB(collection, moduleId);
    // disallow _id/moduleId overwrite
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, moduleId: _m, ...safeUpdate } = update;
    store.update(
      { _id: id, moduleId },
      { $set: { ...safeUpdate, updatedAt: new Date() } },
      {},
      (err: Error | null, num: number) => {
        if (err) return reject(err);
        resolve(num);
      }
    );
  });
}

export function removeDocById(
  collection: CollectionName,
  moduleId: string,
  id: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const store = getCollectionDB(collection, moduleId);
    store.remove({ _id: id, moduleId }, {}, (err: Error | null, num: number) => {
      if (err) return reject(err);
      resolve(num);
    });
  });
}