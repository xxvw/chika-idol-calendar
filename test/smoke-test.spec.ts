import { describe, expect, it, vi } from "vitest";
import {
  pollHealth,
  validateHealthResponse,
} from "../scripts/smoke-test-lib.mjs";

describe("deployment smoke test", () => {
  it("一時的な404をretryして成功する", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        Response.json({ status: "ok", environment: "production" }),
      );
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollHealth({
        deploymentUrl: "https://example.workers.dev",
        expectedEnvironment: "production",
        fetchImpl,
        sleep,
        attempts: 3,
        delayMs: 1,
      }),
    ).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("retry上限後は最後のHTTPエラーを報告する", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      pollHealth({
        deploymentUrl: "https://example.workers.dev",
        expectedEnvironment: "staging",
        fetchImpl,
        sleep: () => Promise.resolve(),
        attempts: 2,
        delayMs: 1,
      }),
    ).rejects.toThrow("smoke test failed after 2 attempts: HTTP 503");
  });

  it("環境名が異なるhealth responseを拒否する", () => {
    expect(() =>
      validateHealthResponse(
        JSON.stringify({ status: "ok", environment: "staging" }),
        "production",
      ),
    ).toThrow(
      "unexpected health response: expected status=ok and environment=production",
    );
  });

  it("不正なJSONを明確なエラーで拒否する", () => {
    expect(() => validateHealthResponse("", "staging")).toThrow(
      "health endpoint did not return valid JSON",
    );
  });
});
