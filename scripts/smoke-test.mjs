import console from "node:console";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { pollHealth } from "./smoke-test-lib.mjs";

const deploymentUrl = process.env.DEPLOYMENT_URL;
const expectedEnvironment = process.env.EXPECTED_ENVIRONMENT;

if (!deploymentUrl) throw new Error("DEPLOYMENT_URL is required");
if (!expectedEnvironment) throw new Error("EXPECTED_ENVIRONMENT is required");

await pollHealth({
  deploymentUrl,
  expectedEnvironment,
  fetchImpl: globalThis.fetch,
  sleep,
  onRetry: ({ attempt, attempts, error }) => {
    console.warn(
      `health check attempt ${attempt}/${attempts} failed: ${error}`,
    );
  },
});

console.log(`health check passed for ${expectedEnvironment}`);
