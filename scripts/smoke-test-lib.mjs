import { URL } from "node:url";

const defaultAttempts = 24;
const defaultDelayMs = 5_000;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function validateHealthResponse(payload, expectedEnvironment) {
  let body;
  try {
    body = JSON.parse(payload);
  } catch {
    throw new Error("health endpoint did not return valid JSON");
  }

  if (
    body === null ||
    typeof body !== "object" ||
    body.status !== "ok" ||
    body.environment !== expectedEnvironment
  ) {
    throw new Error(
      `unexpected health response: expected status=ok and environment=${expectedEnvironment}`,
    );
  }
}

export async function pollHealth({
  deploymentUrl,
  expectedEnvironment,
  fetchImpl,
  sleep,
  attempts = defaultAttempts,
  delayMs = defaultDelayMs,
  onRetry = () => undefined,
}) {
  if (attempts < 1) throw new Error("attempts must be at least 1");

  const healthUrl = new URL("/health", deploymentUrl);
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(healthUrl, { redirect: "error" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      validateHealthResponse(await response.text(), expectedEnvironment);
      return;
    } catch (error) {
      lastError = errorMessage(error);
      if (attempt === attempts) break;

      onRetry({ attempt, attempts, error: lastError });
      await sleep(delayMs);
    }
  }

  throw new Error(`smoke test failed after ${attempts} attempts: ${lastError}`);
}
