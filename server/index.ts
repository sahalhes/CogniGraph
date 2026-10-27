import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app";
import { config } from "./config";
import { repository } from "./database";

const app = createApp();
if (config.production) {
  const dist = fileURLToPath(new URL("../dist", import.meta.url));
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
const server = app.listen(config.port, config.host, () => {
  console.log(
    `CogniGraph API listening on http://${config.host}:${config.port}`,
  );
  if (
    config.aiProvider === "openrouter"
      ? !config.openrouterKey
      : !config.geminiKey
  )
    console.log(
      "AI is not configured. Add the selected provider API key to .env.",
    );
});
async function shutdown() {
  server.close();
  await repository.close();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
