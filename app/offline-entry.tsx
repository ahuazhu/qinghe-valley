import React from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import FarmGame from "./game";

const root = document.getElementById("qinghe-offline-root");

if (!root) {
  throw new Error("找不到青禾谷离线版的启动位置");
}

createRoot(root).render(
  <React.StrictMode>
    <FarmGame />
  </React.StrictMode>,
);
