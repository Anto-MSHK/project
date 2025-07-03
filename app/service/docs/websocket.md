# WebSocket Message Bus – Integration Guide for Modules

> This document explains **how to connect to and communicate over the WebSocket message bus** exposed by the Combiner Service.  
> It is aimed at front-end *modules* ("panels") that are generated or maintained with the help of Large Language Models (LLMs).

## 1  Conceptual model

* **Module** – a logical unit identified by a unique string `moduleId`.  
  A module typically consists of two visual panels `left` and `right`, but any number of clients may connect under the same `moduleId`.
* **Panel** – an optional opaque string (most commonly `left` or `right`) that helps UI clients distinguish between views.  
  The value is **not** used for routing and can be anything that is helpful to the client.
* **Message Bus** – a very thin wrapper around a WebSocket server.  
  It keeps an in-memory *room* for each `moduleId` and simply **forwards every message it receives from one client to all the other clients in the same room** — no persistence, no business logic.

```
┌──────────────┐        "room" = moduleId
│  Module A    │◄───────────────────────────────────────┐
│  (left)      │──┐                                    │
└──────────────┘  │                      Combiner Srv  │
                 │   ┌──────────────────────────────┐  │
┌──────────────┐  │   │WS Bus: /ws?moduleId=A&panel=…│◄─┘
│  Module A    │◄─┘   └──────────────────────────────┘
│  (right)     │
└──────────────┘
```

## 2  Connecting

````text
ws://<HOST>/ws?moduleId=<MODULE_ID>[&panel=<PANEL_ID>]
````

Parameter | Required | Description
-----------|----------|------------
`moduleId` | **yes**  | Arbitrary string (URL-encoded) that groups all sockets that should see each other's messages.
`panel`    | no       | Optional hint such as `left` or `right`. Purely informational.

Notes:
* If `moduleId` is missing the server closes the socket with code **1008** (policy violation).
* The default path is `/ws`, but your deployment may mount it elsewhere when the `MessageBusManager` is instantiated.

### Welcome frame
Immediately after a successful handshake the server sends a JSON frame so that the client knows the connection is fully established:

```json
{ "type": "connection_established" }
```

You may ignore this frame or use it to switch UI state from *connecting* to *connected*.

## 3  Message semantics

* **Broadcast scope** – Messages are delivered *only* to sockets that share the same `moduleId`.  
  Sockets with different `moduleId`s are completely isolated.
* **No echo** – The originating socket **does not** receive its own message back.
* **Transport agnostic** – Payloads are treated as opaque binary/text data. *However,* using UTF-8 JSON is strongly recommended so that LLMs can understand and generate messages.

### Recommended message envelope

There is no enforced schema, but we recommend the following minimal envelope so that future tooling can reason about the conversation:

```json
{
  "type": "<event-name>",      // e.g. "cursor_move", "chat", "error"
  "sender": "<panel-id>",      // e.g. "left", "right" or any string you passed via ?panel=
  "payload": { /* ... */ }      // event-specific data
}
```

Example chat message from the *left* panel:

```json
{
  "type": "chat",
  "sender": "left",
  "payload": {
    "text": "Hello 👋 – can you see this?"
  }
}
```

## 4  Client example (vanilla JavaScript)

```js
const moduleId = "my-module-42";
const panel    = "left";  // or "right"

const ws = new WebSocket(`ws://${location.host}/ws?moduleId=${moduleId}&panel=${panel}`);

ws.addEventListener("open", () => {
  console.log("WS connected");
  // optional: send a hello message
  ws.send(JSON.stringify({
    type: "chat",
    sender: panel,
    payload: { text: "👋 hi from left panel" }
  }));
});

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  console.log("incoming", msg);
});

ws.addEventListener("close", (ev) => {
  console.log("WS closed", ev.code, ev.reason);
  // implement your own reconnection logic here…
});
```

## 5  Disconnection codes you may encounter

Code | Reason
-----|--------
`1000` | Normal closure
`1001` | Server is shutting down (sent by Combiner Service)
`1008` | Missing or invalid `moduleId`
`1011` | Internal error on the server

## 6  Best practices for module authors

1. **Keep messages small & serialisable.** Avoid sending DOM nodes or huge binary blobs.
2. **Version your events** if you expect the schema to evolve. Example: `type = "v2:selection"`.
3. **Reconnect with back-off** to handle network hiccups or server restarts.
4. **Validate incoming data** – never blindly trust the payload even if it came from your sibling panel.
5. **Graceful shutdown** – close the socket when the tab/view is unloaded to free up resources on the server.

---

Need help? Reach out to the Combiner Service maintainers or file an issue. 🎉 