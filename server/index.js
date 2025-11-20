import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5174;

const distPath = path.resolve(__dirname, "../client/dist");

app.use(express.static(distPath));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/@vite") || _req.path.includes("node_modules")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`TwiboFrameEditor server running on http://localhost:${PORT}`);
});

