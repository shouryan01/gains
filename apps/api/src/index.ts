import { Hono } from "hono";
const app = new Hono();
app.get("/api/health", (c) => c.json({ status: "ok", version: "0.1.0" }));
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));
export default app;
