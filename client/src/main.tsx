/**
 * Application Entry Point
 * 
 * This file initializes the React application by:
 * - Setting up the React root element
 * - Importing global styles and theme configuration
 * - Rendering the main App component
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize React application and render to DOM
createRoot(document.getElementById("root")!).render(<App />);
