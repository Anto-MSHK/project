
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../shared/store";
import "../shared/styles/global.css";
import App from "./App";

// Create container for left panel
const appContainer = document.createElement("div");
appContainer.style.position = "fixed";
appContainer.style.top = "0";
appContainer.style.left = "0";
appContainer.style.width = "50%";
appContainer.style.height = "100vh";
appContainer.style.background = "var(--bg-color)";
appContainer.style.zIndex = "9999";
appContainer.style.display = "flex";
appContainer.style.flexDirection = "column";
appContainer.style.fontFamily = "Inter, sans-serif";
appContainer.style.borderRight = "1px solid var(--border-color)";
appContainer.style.overflow = "hidden";

const shadowRoot = appContainer.attachShadow({ mode: "open" });

// Add CSS variables to shadow root
const style = document.createElement("style");
style.textContent = `
  :host {
    --bg-color: #ffffff;
    --text-color: #000000;
    --border-color: #e0e0e0;
    --hover-color: #f5f5f5;
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --input-bg: #ffffff;
    --panel-bg: #ffffff;
    --header-bg: #f8f9fa;
    --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
`;
shadowRoot.appendChild(style);

document.body.appendChild(appContainer);

const root = ReactDOM.createRoot(shadowRoot);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

