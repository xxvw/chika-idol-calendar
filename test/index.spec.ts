import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Worker", () => {
  it("GET / は準備中メッセージを返す", async () => {
    const response = await SELF.fetch("https://example.com/");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toContain("準備中");
  });

  it("GET /health は環境名を含むヘルスチェックを返す", async () => {
    const response = await SELF.fetch("https://example.com/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(env.APP_ENV).toBe("staging");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      environment: "staging",
    });
  });

  it("未定義パスは JSON の 404 を返す", async () => {
    const response = await SELF.fetch("https://example.com/unknown");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });
});
