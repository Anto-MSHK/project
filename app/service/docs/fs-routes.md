# Module-scoped File System API – Integration Guide for Generated Modules

> This document explains **how to browse and manipulate the server-side file system** through the Combiner Service REST endpoints.  
> It is aimed at front-end *modules* (also called *panels*) that are generated or maintained with the help of Large Language Models (LLMs).
>
> • Each **module** is identified by a unique `moduleId`.  
> • A module usually contains two visual panels (`left` and `right`) which communicate over the WebSocket bus (see `docs/websocket.md`).  
> • The HTTP routes described here are **scoped to the calling module** and protected by an explicit permission flag in `manifest.json`.

---

## 1  Quick reference

````text
# directory listing
GET  /api/fs/list?path=<REL|/modules/{moduleId}/…>

# read a file (max 10 MB)
POST /api/fs/read   { "path": <STRING>, "encoding": "utf-8" | "base64" | … }

# write / overwrite a file (creates parent dirs)
POST /api/fs/write  { "path": <STRING>, "content": <STRING|BINARY>, "encoding": "utf-8" | "base64" | … }
````

**Header** | **Required** | **Description**
-----------|--------------|----------------
`X-Module-Id` | ✅ | Identifies the calling module. All file-system operations are confined to this id.

Notes:
* The routes are mounted under **`/api/fs`** by default. Inspect your deployment config if the base path differs.
* Access is granted only if the module's manifest contains `"permissions": { "fileSystem": true }`.
* Attempts to access files outside the allowed roots are rejected with **400 Invalid path**.

---

## 2  Path rules & security model

The server supports **two syntaxes** to target files and folders:

1. **Relative paths** – Resolved against the Combiner Service *working directory* (usually the project root).  
   Example: `src/foo/bar.txt` → `/ABSOLUTE/PROJECT_ROOT/src/foo/bar.txt`

2. **Module storage paths** – Absolute-like paths that start with `/modules/{moduleId}`.  
   Example: `/modules/my-module/uploads/image.png` → `{GLOBAL_MODULES_DIR}/my-module/uploads/image.png`

All paths go through a *sanitiser* that enforces the following rules:

* `..` segments, Windows drive letters (`C:\`), and exotic separators are disallowed.
* When using the `/modules/…` form the `{moduleId}` **must match** the caller's `X-Module-Id`.
* After normalisation the resolved absolute path must stay **inside** its designated root directory.

If any check fails the request is aborted with **400 Invalid path**.

---

## 3  Listing a directory

````bash
GET /api/fs/list?path=/modules/my-module
X-Module-Id: my-module
````

Successful response **200**:

```json
{
  "path": "/modules/my-module",       // echo of the canonical path
  "items": [
    { "name": "uploads", "type": "directory", "size": null, "modified": "2024-05-30T08:12:34.123Z", "path": "/modules/my-module/uploads" },
    { "name": "notes.txt", "type": "file", "size": 1024, "modified": "2024-05-29T20:15:01.001Z", "path": "/modules/my-module/notes.txt" }
  ]
}
```

Error scenarios:

HTTP code | Reason
----------|-------
`400` | Path is not a directory / invalid
`403` | Missing permission (`fileSystem`)
`404` | Directory does not exist
`500` | Unexpected server error

---

## 4  Reading a file

````bash
POST /api/fs/read
X-Module-Id: my-module
Content-Type: application/json

{ "path": "/modules/my-module/notes.txt", "encoding": "utf-8" }
````

Response **200** (truncated):

```json
{
  "path": "/modules/my-module/notes.txt",
  "size": 1024,
  "modified": "2024-05-29T20:15:01.001Z",
  "encoding": "utf-8",
  "content": "Hello world! …"
}
```

Limits & notes:
* **10 MB** maximum file size. Larger files yield **413 File is too large**.
* Any valid Node.js `BufferEncoding` is accepted (`utf-8`, `base64`, `hex`, …).
* Binary data (e.g. images) should be fetched with `encoding = "base64"` and decoded client-side.

---

## 5  Writing a file

````bash
POST /api/fs/write
X-Module-Id: my-module
Content-Type: application/json

{
  "path": "/modules/my-module/notes.txt",
  "content": "Hello world! 👋",
  "encoding": "utf-8"
}
````

Response **200**:

```json
{
  "success": true,
  "path": "/modules/my-module/notes.txt",
  "size": 13,
  "modified": "2024-05-30T09:00:00.000Z"
}
```

Behaviour details:
* Parent directories are **created automatically** (`mkdir -p`).
* Existing files are overwritten atomically.
* Returning `size` & `modified` lets the client update its local cache instantly.

---

## 6  Error handling summary

HTTP code | Scenario | Body example
----------|----------|-------------
`400` | `path` missing or invalid | `{ "error": "Invalid path" }`
`403` | Module lacks the `fileSystem` permission | `{ "error": "Access denied" }`
`404` | File/folder not found | `{ "error": "File not found" }`
`413` | File larger than 10 MB (read) | `{ "error": "File is too large" }`
`500` | Any unhandled server failure | `{ "error": "Internal Server Error" }`

---

## 7  Best practices for module authors

1. **Keep files small & text-based** when possible. Huge binaries strain both network and storage.
2. **Validate user input** – never feed arbitrary paths into the API without sanitising on the client as well.
3. **Display meaningful error messages** based on the status codes listed above.
4. **Cache reads** to minimise round-trips, but always fall back to a fresh request after a write.
5. **Combine with the WebSocket bus** to notify sibling panels about newly created or updated files.

---

Need help? Reach out to the Combiner Service maintainers or open an issue. 📂✨ 