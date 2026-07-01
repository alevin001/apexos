import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { runtimeConfig } from "../config.js";
import { executePipeline, executePipelineDry } from "../pipeline/orchestrator.js";
import { RuntimeError } from "../shared/errors.js";
import type { ExecutiveRequest } from "../types/executive-request.js";

const MAX_BODY_SIZE = 1_048_576;

/**
 * HTTP server — exposes the runtime pipeline as a REST endpoint.
 * Interface adapters (ChatGPT MCP, Executive UI) invoke runtime via POST /runtime/execute.
 */
export function startServer(port = runtimeConfig.port): void {
  const server = createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (err) {
      sendError(res, 500, err);
    }
  });

  server.listen(port, () => {
    console.log(`ApexOS Runtime Engine listening on http://localhost:${port}`);
    console.log(`  POST /runtime/execute — execute pipeline`);
    console.log(`  POST /runtime/context-package — assemble context only (dry)`);
    console.log(`  GET  /health — health check`);
    console.log(`  LLM provider: ${runtimeConfig.dryRun || !runtimeConfig.openaiApiKey ? "stub (dry-run)" : runtimeConfig.llmProvider}`);
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? "/";

  if (req.method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "apexos-runtime",
      version: "0.13.0",
      dryRun: runtimeConfig.dryRun || !runtimeConfig.openaiApiKey,
    });
    return;
  }

  if (req.method === "POST" && url === "/runtime/execute") {
    const body = await readBody(req);
    const request = JSON.parse(body) as ExecutiveRequest;
    const result = await executePipeline(request);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url === "/runtime/context-package") {
    const body = await readBody(req);
    const request = JSON.parse(body) as ExecutiveRequest;
    const ctx = await executePipelineDry(request);
    sendJson(res, 200, {
      requestId: ctx.request.requestId,
      contextPackage: ctx.contextPackage,
      stages: ctx.stages,
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new RuntimeError("Request body too large", "PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res: ServerResponse, status: number, err: unknown): void {
  if (err instanceof RuntimeError) {
    sendJson(res, status, {
      error: err.message,
      code: err.code,
      stage: err.stage,
    });
    return;
  }
  sendJson(res, status, {
    error: err instanceof Error ? err.message : "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

startServer();
