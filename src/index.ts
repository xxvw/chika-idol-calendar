type Environment = "staging" | "production";

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  fetch(request, env): Response {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response("地下アイドルカレンダーは準備中です。\n", {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ status: "ok", environment: env.APP_ENV }, 200);
      }

      return json({ error: "not_found" }, 404);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "request_failed",
          method: request.method,
          path: url.pathname,
          error: error instanceof Error ? error.message : "unknown_error",
        }),
      );
      return json({ error: "internal_server_error" }, 500);
    }
  },
} satisfies ExportedHandler<{ APP_ENV: Environment }>;
