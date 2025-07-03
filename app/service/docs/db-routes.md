# Module-scoped Database API – Integration Guide for Generated Modules

> This document explains **how to persist and query data** via the REST API exposed by the Combiner Service.  
> It is aimed at front-end *modules* (aka *panels*) that are generated or maintained with the help of Large Language Models (LLMs).
>
> • Each **module** is identified by a unique `moduleId`.  
> • A module can contain two visual panels (`left` and `right`) or any number of UI clients.  
> • Panels exchange **real-time messages** over the WebSocket bus (see `docs/websocket.md`).  
> • **Structured data** that should survive page reloads or process restarts is stored through the HTTP endpoints described here.

---

## 1  Quick reference

````text
POST   /api/db/:moduleId/:collection          → create a document
GET    /api/db/:moduleId/:collection          → list documents (supports ?filter=…)
GET    /api/db/:moduleId/:collection/:id      → read single document
PUT    /api/db/:moduleId/:collection/:id      → update document
DELETE /api/db/:moduleId/:collection/:id      → delete document
````

**Parameter** | **Type** | **Required** | **Description**
--------------|-----------|--------------|----------------
`moduleId`    | string    | ✅           | Logical room / workspace identifier used by both HTTP & WebSocket APIs. All data is partitioned by this value.
`collection`  | string    | ✅           | Free-form label (e.g. `sessions`, `documents`). Think of this as a lightweight table name.
`id`          | string    | depends      | Document `_id` returned by the *create* endpoint. Required for *read*, *update* and *delete*.

Notes:
* The routes are **mounted at `/api/db`** by default. If the Combiner Service is embedded into another app the prefix may differ – always inspect your deployment config.
* The underlying store is [NeDB](https://github.com/louischatriot/nedb) so most MongoDB-style query operators are available.

---

## 2  Creating a document

````bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{ "title": "First note", "text": "Hello world!" }' \
     http://localhost:3000/api/db/my-module/notes
````

Successful response **201**:

```json
{
  "_id": "bXlVc2VySWQxMjM=",
  "title": "First note",
  "text": "Hello world!"
}
```

The server automatically adds:
* `moduleId` – derived from the URL.
* `createdAt` – ISO timestamp.

---

## 3  Listing documents

### 3.1  Plain list

````bash
GET /api/db/my-module/notes
````

Returns an array of documents (may be empty):

```json
[
  { "_id": "…", "title": "…", "text": "…", "createdAt": "…" },
  { "_id": "…", "title": "…", "text": "…", "createdAt": "…" }
]
```

### 3.2  Filtered list

Add the query parameter **`filter`** containing a **URL-encoded JSON string** that follows NeDB/Mongo syntax:

````bash
GET /api/db/my-module/notes?filter=%7B%22title%22%3A%20%22First%20note%22%7D
````

Decoded filter: `{ "title": "First note" }`

If the string cannot be parsed the server responds with **400** `Invalid filter JSON`.

---

## 4  Reading a single document

````bash
GET /api/db/my-module/notes/bXlVc2VySWQxMjM=
````

* **200** – document found, JSON body returned.  
* **404** – document or module does not exist.

---

## 5  Updating a document

````bash
curl -X PUT \
     -H "Content-Type: application/json" \
     -d '{ "text": "Updated text" }' \
     http://localhost:3000/api/db/my-module/notes/bXlVc2VySWQxMjM=
````

Response **200**:

```json
{ "updated": true }
```

Server logic:
* Only the provided fields are overwritten (`$set`).  
* `updatedAt` timestamp is injected automatically.  
* Attempting to change `_id` or `moduleId` is ignored for safety.

---

## 6  Deleting a document

````bash
DELETE /api/db/my-module/notes/bXlVc2VySWQxMjM=
````

Response **200**:

```json
{ "deleted": true }
```

---

## 7  Error handling

HTTP code | Scenario | Body example
----------|----------|-------------
`400` | Malformed `filter` JSON | `{ "error": "Invalid filter JSON" }`
`404` | Unknown `moduleId`, `collection` or `id` | `{ "error": "Not found" }`
`500` | Unexpected server error | `{ "error": "Failed to …" }`

---

## 8  Putting it all together (LLM prompt aid)

When asking an LLM to generate a new module, provide the following snippet so it understands *both* persistence and real-time aspects:

> You are building a left/right panel pair that shares a `moduleId`.  
> • Use the WebSocket bus at `ws://HOST/ws?moduleId=…&panel=left|right` for live collaboration.  
> • Store persistent data with the REST API:  
>   – `POST  /api/db/${moduleId}/<collection>` to create  
>   – `GET   /api/db/${moduleId}/<collection>?filter=<json>` to query  
>   – `PUT   /api/db/${moduleId}/<collection>/${id}` to update  
>   – `DELETE /api/db/${moduleId}/<collection>/${id}` to remove.

Feel free to embed the whole of this document inside your system prompt so the model has a concise, authoritative reference.

---

Need help? Reach out to the Combiner Service maintainers or open an issue. 🚀 