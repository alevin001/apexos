import * as z from "zod/v4";
import express, { type Request, type RequestHandler, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { allowedMethods } from "@modelcontextprotocol/sdk/server/auth/middleware/allowedMethods.js";
import { redirectUriMatches } from "@modelcontextprotocol/sdk/server/auth/handlers/authorize.js";
import {
  InvalidClientError,
  InvalidRequestError,
  OAuthError,
  ServerError,
  TooManyRequestsError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import {
  createOAuthMetadata,
  mcpAuthMetadataRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { clientRegistrationHandler } from "@modelcontextprotocol/sdk/server/auth/handlers/register.js";
import { tokenHandler } from "@modelcontextprotocol/sdk/server/auth/handlers/token.js";
import type { ApexOsOAuthProvider } from "./oauth-provider.js";
import type { OauthHttpConfig } from "./oauth-config.js";
import {
  createAdminSessionConfig,
  parseAdminSession,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "./admin-session.js";
import {
  clearPendingAuthorizationCookie,
  consumePendingAuthorization,
  setPendingAuthorizationCookie,
  storePendingAuthorization,
} from "./pending-authorization.js";
import { checkLoginRateLimit, loginRateLimitKey } from "./login-rate-limit.js";

const ClientAuthorizationParamsSchema = z.object({
  client_id: z.string(),
  redirect_uri: z
    .string()
    .optional()
    .refine((value) => value === undefined || URL.canParse(value), {
      message: "redirect_uri must be a valid URL",
    }),
});

const RequestAuthorizationParamsSchema = z.object({
  response_type: z.literal("code"),
  code_challenge: z.string(),
  code_challenge_method: z.literal("S256"),
  scope: z.string().optional(),
  state: z.string().optional(),
  resource: z.string().url().optional(),
});

export interface SecureOAuthRoutesContext {
  provider: ApexOsOAuthProvider;
  config: OauthHttpConfig;
}

export function mountSecureOAuthRoutes(
  app: express.Express,
  context: SecureOAuthRoutesContext
): void {
  const { provider, config } = context;
  if (!config.adminPassword || !config.sessionSecret) {
    throw new Error("OAuth admin password and session secret are required");
  }

  const sessionConfig = createAdminSessionConfig(
    config.sessionSecret,
    config.issuerUrl.protocol === "https:",
    config.sessionTtlSeconds
  );
  const rateLimitOption = config.disableRateLimit ? false : undefined;

  const oauthMetadata = createOAuthMetadata({
    provider,
    issuerUrl: config.issuerUrl,
    scopesSupported: [...config.scopesSupported],
  });

  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata,
      resourceServerUrl: config.resourceUrl,
      scopesSupported: [...config.scopesSupported],
      resourceName: config.resourceName,
    })
  );

  app.use(
    new URL(oauthMetadata.registration_endpoint!).pathname,
    clientRegistrationHandler({
      clientsStore: provider.clientsStore,
      rateLimit: rateLimitOption,
    })
  );

  app.use(
    new URL(oauthMetadata.token_endpoint).pathname,
    tokenHandler({
      provider,
      rateLimit: rateLimitOption,
    })
  );

  app.use(
    new URL(oauthMetadata.authorization_endpoint).pathname,
    createSecureAuthorizationHandler({ provider, config, sessionConfig, rateLimitOption })
  );

  app.get("/oauth/login", (_req, res) => {
    res.type("html").send(renderLoginPage());
  });

  app.post(
    "/oauth/login",
    express.urlencoded({ extended: false }),
    createLoginHandler({ provider, config, sessionConfig })
  );
}

function createSecureAuthorizationHandler(options: {
  provider: ApexOsOAuthProvider;
  config: OauthHttpConfig;
  sessionConfig: ReturnType<typeof createAdminSessionConfig>;
  rateLimitOption: false | undefined;
}): RequestHandler {
  const router = express.Router();
  router.use(allowedMethods(["GET", "POST"]));
  router.use(express.urlencoded({ extended: false }));

  if (options.rateLimitOption !== false) {
    router.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: new TooManyRequestsError(
          "You have exceeded the rate limit for authorization requests"
        ).toResponseObject(),
      })
    );
  }

  router.all("/", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    try {
      const validated = await validateAuthorizationRequest(req, options.provider);
      const session = parseAdminSession(req, options.sessionConfig);

      if (!session) {
        const pending = storePendingAuthorization(validated.client, validated.params);
        setPendingAuthorizationCookie(res, pending.pendingId, options.sessionConfig);
        res.redirect("/oauth/login");
        return;
      }

      await options.provider.authorize(validated.client, validated.params, res);
    } catch (error) {
      handleAuthorizationError(error, res);
    }
  });

  return router;
}

function createLoginHandler(options: {
  provider: ApexOsOAuthProvider;
  config: OauthHttpConfig;
  sessionConfig: ReturnType<typeof createAdminSessionConfig>;
}): RequestHandler {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const rateKey = loginRateLimitKey(req);
    if (!checkLoginRateLimit(rateKey)) {
      res.status(429).type("html").send(renderLoginPage("Too many login attempts. Try again later."));
      return;
    }

    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!verifyAdminPassword(password, options.config.adminPassword!)) {
      res.status(401).type("html").send(renderLoginPage("Invalid credentials."));
      return;
    }

    const pending = consumePendingAuthorization(req, options.sessionConfig);
    if (!pending) {
      res.status(400).type("html").send(renderLoginPage("Authorization request expired. Restart the connection."));
      return;
    }

    const client = await options.provider.clientsStore.getClient(pending.clientId);
    if (!client) {
      res.status(400).type("html").send(renderLoginPage("Authorization request expired. Restart the connection."));
      return;
    }

    setAdminSessionCookie(res, options.sessionConfig);
    clearPendingAuthorizationCookie(res, options.sessionConfig.secureCookie);

    try {
      await options.provider.authorize(client, pending.params, res);
    } catch (error) {
      handleAuthorizationError(error, res);
    }
  };
}

async function validateAuthorizationRequest(req: Request, provider: ApexOsOAuthProvider) {
  const source = req.method === "POST" ? req.body : req.query;
  const clientResult = ClientAuthorizationParamsSchema.safeParse(source);
  if (!clientResult.success) {
    throw new InvalidRequestError(clientResult.error.message);
  }

  const client = await provider.clientsStore.getClient(clientResult.data.client_id);
  if (!client) {
    throw new InvalidClientError("Invalid client_id");
  }

  let redirectUri = clientResult.data.redirect_uri;
  if (redirectUri !== undefined) {
    if (!client.redirect_uris.some((registered) => redirectUriMatches(redirectUri!, registered))) {
      throw new InvalidRequestError("Unregistered redirect_uri");
    }
  } else if (client.redirect_uris.length === 1) {
    redirectUri = client.redirect_uris[0];
  } else {
    throw new InvalidRequestError(
      "redirect_uri must be specified when client has multiple registered URIs"
    );
  }

  const authResult = RequestAuthorizationParamsSchema.safeParse(source);
  if (!authResult.success) {
    throw new InvalidRequestError(authResult.error.message);
  }

  const scopes = authResult.data.scope ? authResult.data.scope.split(" ") : [];

  return {
    client,
    params: {
      state: authResult.data.state,
      scopes,
      redirectUri: redirectUri!,
      codeChallenge: authResult.data.code_challenge,
      resource: authResult.data.resource ? new URL(authResult.data.resource) : undefined,
    },
  };
}

function handleAuthorizationError(error: unknown, res: Response): void {
  if (error instanceof OAuthError) {
    const status = error instanceof ServerError ? 500 : 400;
    res.status(status).json(error.toResponseObject());
    return;
  }
  res.status(500).json(new ServerError("Internal Server Error").toResponseObject());
}

function renderLoginPage(errorMessage?: string): string {
  const errorBlock = errorMessage
    ? `<p style="color:#b00020">${escapeHtml(errorMessage)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ApexOS MCP Login</title>
</head>
<body>
  <main>
    <h1>ApexOS MCP Login</h1>
    <p>Sign in to authorize ChatGPT access to ApexOS.</p>
    ${errorBlock}
    <form method="post" action="/oauth/login">
      <label for="password">Password</label><br>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Continue</button>
    </form>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function validateAuthorizationRequestForTests(
  req: Request,
  provider: ApexOsOAuthProvider
) {
  return validateAuthorizationRequest(req, provider);
}
