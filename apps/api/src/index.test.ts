import { expect, it } from "vitest";
import app from "./index";
it("serves the API health endpoint and rejects unknown API routes", async () => {
  const response = await app.request("/api/health");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", version: "0.1.0" });
  expect((await app.request("/api/unknown")).status).toBe(404);
});
