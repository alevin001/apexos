/**
 * ApexOS MCP HTTP binds exclusively to loopback.
 * Remote binding is intentionally unsupported — access from ChatGPT
 * is via the authenticated OpenAI secure tunnel only.
 */

export const MCP_HTTP_HOST = "127.0.0.1" as const;

export function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();

  if (normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost") {
    return true;
  }

  // IPv4 loopback range 127.0.0.0/8
  const match = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(normalized);
  if (!match) {
    return false;
  }

  return match.slice(1).every((octet) => {
    const value = Number(octet);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

export function assertLoopbackHost(host: string): string {
  if (!isLoopbackHost(host)) {
    throw new Error(
      `ApexOS MCP HTTP server must bind exclusively to loopback (127.0.0.1). ` +
        `Refusing non-loopback host "${host}". Remote binding is not permitted.`
    );
  }

  return host;
}
