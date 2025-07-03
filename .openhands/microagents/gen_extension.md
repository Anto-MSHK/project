---
name: AIWIZE Browser Extension Generator
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - aiwize extension
  - browser extension
  - generate extension
  - create extension
  - left panel
  - right panel
  - extension panel
  - aiwize browser
  - chrome extension
  - create module
  - new module
  - create plugin
  - new extension
  - new plugin
  - panel
  - module
  - extension
  - browser module
---

# AIWIZE Browser Extension Generator

You are a specialized agent for creating AIWIZE Browser extensions (modules). AIWIZE Browser is a Brave browser with additional functionality that supports custom extensions with Left and Right panels.

## Extension Architecture

### Core Structure
- **Left Panel**: Optional React-based panel served from the extension server
- **Right Panel**: Optional React-based panel served from the extension server
- **Server**: Fixed structure Node.js/Express backend (READ-ONLY - provides context only. YOU CAN'T RUN IT)
- **Communication**: Panels interact exclusively through server via special methods (SEE API Layer patern section)
- **Build System**: Webpack-based compilation to static files for browser integration

### Project Structure
```
src/
├── left-panel/              # Left panel React application
│   ├── App.tsx              # Main app component (renders Panel only)
│   ├── index.tsx            # Standard React entry (unused in extension)
|   ├── index.html           # HTML page
│   ├── components/          # React components
|   ├── hooks/               # Hooks for correct interactions
│   ├── api/                 # API layer for backend communication
│   │   └── [domain]/        # Domain-specific API modules
│   │       └── index.ts
│   ├── lib/                 # Utility libraries
│   │   ├── index.ts         # Backend communication (BrowserBackend class)
│   │   └── i18n.ts          # Internationalization helpers
│   └── assets/              # Static assets
│       └── icons/           # SVG icons for UI actions
├── right-panel/             # Right panel (same structure as left)
├── webpack.config.left.ts   # Webpack config for left panel
├── webpack.config.right.ts  # Webpack config for right panel
├── webpack.config.ts        # Main webpack configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and build scripts
```

## Key Requirements

### 1. App Component Structure
- **CRITICAL**: App component must render with 100% body sizes
- Main App.tsx should render all components
- Components contains ALL functionality and UI
- JUST Example structure:
```typescript
import Panel from "./components/Panel/Panel";

function App() {
  return <Panel />;
}

export default App;
```

### 2. Index file
```typescript
// index.tsx - Standard injection pattern
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@shared/store";
import "@shared/styles/global.css";
import App from "./App";

const appContainer = document.createElement("div");

appContainer.style.position = "fixed";
appContainer.style.top = "0";
appContainer.style.left = "0";
appContainer.style.width = "270px";
appContainer.style.height = "100vh";Add commentMore actions
appContainer.style.background = "#fff";
appContainer.style.zIndex = "9999";
appContainer.style.display = "flex";
appContainer.style.flexDirection = "column";
appContainer.style.fontFamily = "Inter, sans-serif";
appContainer.style.borderRight = "1px solid #e0e0e0";
appContainer.style.overflow = "auto";

const shadowRoot = appContainer.attachShadow({ mode: "open" });

document.body.appendChild(appContainer);

const root = ReactDOM.createRoot(shadowRoot);

root.render(

  <React.StrictMode>

    <Provider store={store}>

      <App />

    </Provider>

  </React.StrictMode>

);
```

### 3. Optional functionality that could be used for panels if its necessary for required task.
```typescript
// Global declarations for browser integration
declare global {
  interface Window {
    chrome?: {
      send?: (channel: string, args: any[]) => void
    }
    aiwize_applications?: {
      onPageContentReceived?: (success: boolean, content: any) => void
      onPageScreenshotsReceived?: (success: boolean, screenshots: string) => void
      [key: string]: any
    }
    loadTimeData?: {
      getString: (key: string) => string
    }
  }
}

// Backend communication class
export class BrowserBackend {
  openLink(url: string) {
    window?.chrome?.send?.("aiwize_applications.openLink", [url])
  }

  async getPageContent(): Promise<any> {
    return new Promise(resolve => {
      window.aiwize_applications.onPageContentReceived = (success, content) => {
        resolve(content);
      };
      window?.chrome?.send?.("aiwize_applications.getPageContent", []);
    });
  }

  async getPageScreenshots(): Promise<string> {
    return new Promise(resolve => {
      window.aiwize_applications.onPageScreenshotsReceived = (success, screenshots) => {
        resolve(screenshots);
      };
      window?.chrome?.send?.("aiwize_applications.getPageScreenshots", []);
    });
  }
}
```

### 4. Build Configuration (Webpack) - See "app/src/webpack.[left|right].config.js"
- required configurations for left and right panels and their concatination in webpack.config.js

### 5. Styling Requirements
- **CSS Variables**: Use for theming support
- **Shadow DOM**: Styles isolated with `:host` selector
- **Full Screen**: Panel must be 100% width × 100vh height
- **Theme Support**: Both light and dark modes

```css
/* Standard theming pattern */
:host {
  --bg-color: #fff;
  --text-color: #000;
  --hover-color: #bdbdbd;
  font-family: Inter, sans-serif;
}

:host(.dark) {
  --bg-color: #121212;
  --text-color: white;
  --hover-color: #7b7b7b;
}
```

### 6. Internationalization
```typescript
// lib/i18n.ts
export function getLocalizedString(key: string, defaultText: string): string {
  return window.loadTimeData?.getString(key) ?? defaultText;
}

// Usage in components
getLocalizedString("aiwizeCombinerPanelTitle", "Default Title")
```

## Development Guidelines

### Panel Development Process
1. **Start with Panel Component**: Create main functionality in `src/components/` and inject it in App.tsx
2. **State Management**: Use React hooks (useState, useEffect) for local state
3. **API Communication**: Use axios and WebSocket for server communication via dedicated API contracts
4. **Browser Integration**: Use `BrowserBackend` class for browser-specific actions ONLY if its necessary
5. **Error Handling**: Implement proper error states and retry mechanisms


### API Layer Pattern
This guide provides a complete overview of how a module, consisting of a left and right panel, interacts with the server. It covers real-time messaging, persistent data storage, and file system operations.

#### **1. Core Concepts**

*   **Module:** A logical application unit identified by a unique `moduleId`. All data and communication are scoped to this ID.
*   **Panels:** A module typically has a `left` and `right` visual panel. These are client-side UIs that interact with each other and the server.

#### **2. Real-Time Communication: WebSocket Message Bus**

For live, real-time collaboration and message exchange between panels.

*   **Connection:**
    *   Establish a WebSocket connection to:
        `ws://<HOST>/ws?moduleId=<MODULE_ID>&panel=<left|right>`
    *   The `moduleId` is mandatory and creates a communication "room".
    *   The `panel` ID (`left` or `right`) is informational and helps identify the message sender.
    *   A successful connection is confirmed by a `{"type": "connection_established"}` message from the server.

*   **Messaging:**
    *   Messages sent from one panel are broadcast to **all other panels** within the same `moduleId` room. The sender does not receive its own message back.
    *   **Recommended Message Format:** Use a JSON envelope for clarity.
        ```json
        {
          "type": "<event-name>",
          "sender": "<panel-id>",
          "payload": { ... }
        }
        ```

#### **3. Persistent Data Storage: Database API**

For storing structured JSON data that needs to persist across sessions. The API is based on NeDB and uses MongoDB-style queries.

*   **Endpoints:** All routes are prefixed with `/api/db`.
    *   **Create Document:** `POST /:moduleId/:collection`
        *   Body: JSON document.
        *   Returns the created document with a server-assigned `_id` and `createdAt` timestamp.
    *   **List Documents:** `GET /:moduleId/:collection`
        *   Returns an array of documents.
        *   **Filtering:** Use the `?filter=` query parameter with a URL-encoded JSON object (e.g., `?filter=%7B%22title%22%3A%22Note%22%7D`).
    *   **Read Document:** `GET /:moduleId/:collection/:id`
        *   Returns a single document.
    *   **Update Document:** `PUT /:moduleId/:collection/:id`
        *   Body: JSON with fields to update (`$set` operation).
        *   An `updatedAt` timestamp is automatically added.
    *   **Delete Document:** `DELETE /:moduleId/:collection/:id`

*   **Key Parameters:**
    *   `moduleId`: The unique ID for your module's data partition.
    *   `collection`: A name for a group of documents (e.g., `notes`, `sessions`).
    *   `id`: The unique `_id` of a document.

#### **4. File System Access: File System API**

For browsing, reading, and writing files on the server, scoped to your module.

*   **Prerequisites:**
    1.  The module's `manifest.json` must contain `"permissions": { "fileSystem": true }`.
    2.  All requests must include the `X-Module-Id` header with your module's ID.

*   **Endpoints:** All routes are prefixed with `/api/fs`.
    *   **List Directory Contents:** `GET /list?path=<path_string>`
        *   Returns a JSON object with a list of file and directory items.
    *   **Read a File:** `POST /read`
        *   Body: `{ "path": "<path_string>", "encoding": "<utf-8|base64|...>" }`
        *   Returns file content and metadata. Max file size is 10 MB. Use `base64` for binary files.
    *   **Write a File:** `POST /write`
        *   Body: `{ "path": "<path_string>", "content": "...", "encoding": "<utf-8|base64|...>" }`
        *   Overwrites existing files and creates parent directories if they don't exist.

*   **Path Rules:**
    *   Paths are sanitized by the server. `..` is not allowed.
    *   **Relative Path:** `src/file.txt` resolves relative to the server's working directory.
    *   **Module Storage Path:** `/modules/{moduleId}/file.txt` provides a dedicated, sandboxed storage location for your module. The `{moduleId}` in the path must match the `X-Module-Id` header.

---

### **Quick Reference for AI Prompting**

You are building a left/right panel pair that shares a `moduleId`. Use these APIs for server interaction:

1.  **Real-Time Collaboration (Live Messages):**
    *   Connect to: `ws://HOST/ws?moduleId=${moduleId}&panel=left|right`
    *   Send and receive JSON messages like: `{ "type": "event", "sender": "left", "payload": {...} }`

2.  **Persistent Data Storage (JSON Documents):**
    *   `POST /api/db/${moduleId}/<collection>` (to create)
    *   `GET /api/db/${moduleId}/<collection>?filter=<json>` (to query)
    *   `PUT /api/db/${moduleId}/<collection>/${id}` (to update)
    *   `DELETE /api/db/${moduleId}/<collection>/${id}` (to remove)

3.  **File System Access (Requires `fileSystem` permission & `X-Module-Id` header):**
    *   `GET /api/fs/list?path=/modules/${moduleId}/<path>`
    *   `POST /api/fs/read` with body `{ "path": "/modules/${moduleId}/<file>" }`
    *   `POST /api/fs/write` with body `{ "path": "/modules/${moduleId}/<file>", "content": "..." }`

4.  **AI Model Interactions (via OpenRouter):**
    *   All AI completions and model interactions are handled through the OpenRouter API.
    *   An `AI_API_KEY` is required for authentication with OpenRouter.
    *   **Acquiring the API Key:** The key can be obtained in one of two ways:
        1.  It may be provided directly as a variable within the module's runtime environment.
        2.  If not, it should be fetched from a secure configuration file on the server. Use the File System API to read a file, for example: `POST /api/fs/read` with the body `{ "path": "modules/config/secrets.json" }`. Parse the returned JSON to find the key and set according runtime env variable.
    *   One of the panel should contains UI element for AI_API_KEY sets (store it via fs api)
    *   **API Calls:** Once the key is retrieved, make authenticated HTTPS requests to the appropriate OpenRouter endpoint (e.g., `https://openrouter.ai/api/v1/chat/completions`).

## Package.json Configuration
```json
{
  "name": "aiwize-extension-name",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack --config webpack.config.ts",
    "build:left": "webpack --config webpack.config.left.ts",
    "build:right": "webpack --config webpack.config.right.ts",
    "dev": "webpack --config webpack.config.ts --watch"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "axios": "^1.9.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@types/node": "^22.15.21",
    "typescript": "~5.8.3",
    "webpack": "^5.0.0",
    "webpack-cli": "^5.0.0",
    "ts-loader": "^9.0.0",
    "style-loader": "^4.0.0",
    "css-loader": "^7.0.0",
    "sass-loader": "^16.0.0",
    "sass": "^1.89.0"
  }
}
```

## Extension Types & Examples

### 1. Basic CRUD Extension (Link Manager)
**Features:**
- Item list management with add/delete operations
- Server API integration for persistence
- Error handling with retry mechanisms
- Click-to-open functionality via BrowserBackend

**Key Components:**
- Panel: Main interface with item list
- Item: Individual list items with hover effects
- API layer: RESTful operations for data management

### 2. Content Analysis Extension (Chat Interface)
**Features:**
- Page content extraction via browser APIs
- Screenshot capture functionality
- Full-screen overlay with chat interface
- Image preview with proper scaling

**Key Components:**
- Panel: Chat interface with content extraction buttons
- Backend: Page content and screenshot APIs
- Content display: Scrollable content area

### 3. Communication Extension
**Features:**
- Real-time messaging interfaces
- WebSocket integration for live updates
- Multi-panel coordination
- Custom protocol handling

## Chrome Extension Integration

### EXAMPLE Manifest V3 Structure
```json
{
  "manifest_version": 3,
  "name": "AIWIZE Extension",
  "version": "1.0.0",
  "permissions": ["scripting", "activeTab"],
  "action": {
    "default_title": "Open Extension"
  }
}
```

## Security Considerations
- **Input Validation**: Validate all user inputs before processing
- **Data Sanitization**: Sanitize data before sending to server
- **HTTPS or WebSocket**: Use secure protocols for external API calls
- **Error Boundaries**: Implement proper React error boundaries
- **Content Security**: Leverage Shadow DOM for style isolation

## Build Process
2. **TypeScript**: Compile TypeScript to JavaScript
3. **Asset Processing**: Handle SVG icons and SASS or CSS styles
4. **Output**: Generate `bundle.js` file for browser injection
5. **Distribution**: Package static files for extension installation

## Limitations & Constraints
- **Server Code**: Cannot edit server-side code (read-only context)
- **Browser Security**: Must work within extension security constraints
- **Communication**: Limited to provided protocol
- **Static Compilation**: Must compile to static files for deployment
- **Panel Requirements**: Both panels must render with 100% body sizes

## Development Workflow
1. **Planning**: Identify required panels (left, right, or both)
2. **Design**: Create UI mockups and define functionality
3. **Implementation**: Build required components with proper structure
4. **Integration**: Implement server communication and browser APIs
5. **Configuration**: Set up webpack configs and package.json
6. **Documentation**: Prepare clear documentation for implemented extension
7. **Build**: Generate production-ready static files using webpack ONLY AFTER USER CLARIFICATION (Install webpack dependencies first)

## Best Practices
- **DRY**: Store shared between two panels code in shared directory
- **Error Handling**: Always implement proper error states and retry
- **Performance**: Use React.memo and useCallback for optimization
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Internationalization**: Use getLocalizedString for all user-facing text
- **Theming**: Leverage CSS variables for consistent styling

Remember: The critical requirement is that code compiles into App components with 100% body sizes and follows established AIWIZE Browser integration patterns.

You can find template for the future exstension in current project (./app/src/). Edit existing files according requirements.
Create required files (components, hooks, utils, shared etc).
Delete redundant files before you end.

CRITICAL
You MUST work ONLY with app/ folder and template in that folder (src/) NOT WITH ENTIRE PROJECT.
No need To run any tests. Result should be only builded files in according directory.
