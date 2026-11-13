import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// PublicEndpointGuard always passes, so every file using it must document its
// compensating control here. Add new public surface to the allowlist with the
// control that protects it, or the test fails.
type PublicEndpointEntry = {
  file: string;
  control: string;
};

const PUBLIC_ENDPOINT_ALLOWLIST: PublicEndpointEntry[] = [
  {
    file: 'modules/messaging-webhooks/messaging-webhooks.controller.ts',
    control: 'provider webhook signatures verified in SNS/Svix drivers',
  },
  {
    file: 'modules/emailing/controllers/unsubscribe.controller.ts',
    control: 'token-bucket throttle per requester and per token',
  },
  {
    file: 'modules/emailing/controllers/campaign-tracking.controller.ts',
    control: 'throttle in campaign-engagement-capture.service',
  },
  {
    file: 'modules/connected-account-sync-webhooks/connected-account-sync-webhooks.controller.ts',
    control: 'provider channel tokens validated in notification handlers',
  },
  {
    file: 'engine/metadata-modules/route-trigger/route-trigger.controller.ts',
    control:
      'workspace-scoped triggers, optional per-route auth, execution rate limit',
  },
  {
    file: 'engine/core-modules/email-verification/email-verification.resolver.ts',
    control: '256-bit expiring single-use tokens',
  },
  {
    file: 'engine/core-modules/billing-webhook/billing-webhook.controller.ts',
    control: 'Stripe signature verified over rawBody',
  },
  {
    file: 'engine/core-modules/two-factor-authentication/two-factor-authentication.resolver.ts',
    control: 'login-token gated, OTP throttle in service',
  },
  {
    file: 'engine/core-modules/file/controllers/file.controller.ts',
    control:
      'public assets by design; path validated, DB record + UPLOADED required',
  },
  {
    file: 'engine/core-modules/auth/auth.resolver.ts',
    control: 'CaptchaGuard on credential endpoints, token-gated otherwise',
  },
  {
    file: 'engine/core-modules/auth/controllers/google-auth.controller.ts',
    control: 'Google OAuth guard dance',
  },
  {
    file: 'engine/core-modules/auth/controllers/sso-auth.controller.ts',
    control: 'SAML/OIDC guards; metadata endpoint public by design',
  },
  {
    file: 'engine/core-modules/auth/controllers/google-apis-auth.controller.ts',
    control: 'OAuth request-code guards + transient tokens',
  },
  {
    file: 'engine/core-modules/server-route-trigger/server-route-trigger.controller.ts',
    control: 'public dispatch; auth-required resolvers rejected in service',
  },
  {
    file: 'engine/core-modules/auth/controllers/oauth-propagator.controller.ts',
    control: 'redirect target restricted to registered workspace domains',
  },
  {
    file: 'engine/core-modules/auth/controllers/microsoft-auth.controller.ts',
    control: 'Microsoft OAuth guard dance',
  },
  {
    file: 'engine/core-modules/auth/controllers/microsoft-apis-auth.controller.ts',
    control: 'OAuth request-code guards + transient tokens',
  },
  {
    file: 'engine/core-modules/health/controllers/health.controller.ts',
    control:
      'Terminus check with zero indicators; required by Docker healthcheck',
  },
  {
    file: 'engine/core-modules/workspace/workspace.resolver.ts',
    control:
      'branding neutralized on shared DNS (origin and by-id queries); login methods untouched',
  },
  {
    file: 'engine/core-modules/cloudflare/controllers/dns-cloudflare.controller.ts',
    control: 'Cloudflare webhook secret header + zone-id check',
  },
  {
    file: 'engine/core-modules/event-logs/emit/event-log-emitter.resolver.ts',
    control: 'append-only analytics ingestion; typed events, success flag only',
  },
  {
    file: 'engine/core-modules/well-known/controllers/well-known.controller.ts',
    control: 'static discovery documents public by design',
  },
  {
    file: 'engine/core-modules/workflow/controllers/workflow-trigger.controller.ts',
    control:
      'capability URL; active webhook trigger only, run throttle in runner',
  },
  {
    file: 'engine/core-modules/application/application-registration/application-registration.resolver.ts',
    control: 'client-id lookup returns secret-free public DTO',
  },
  {
    file: 'engine/core-modules/application/application-registration/application-registration-claim.controller.ts',
    control: 'signed 15-minute JWT state; GitHub + provenance ownership check',
  },
  {
    file: 'engine/core-modules/application/application-oauth/controllers/oauth-registration.controller.ts',
    control:
      'RFC 7591 DCR; IP rate limit, validated redirects, secretless clients',
  },
  {
    file: 'engine/core-modules/application/application-oauth/controllers/oauth-discovery.controller.ts',
    control: 'RFC 8414/9728 discovery metadata public by design',
  },
  {
    file: 'engine/core-modules/application/application-oauth/controllers/oauth-token.controller.ts',
    control: 'client-secret/PKCE validation, single-use codes, IP rate limit',
  },
  {
    file: 'engine/core-modules/application/connection-provider/connection-provider-oauth.controller.ts',
    control: 'verified transient token + membership; state-bound callback',
  },
  {
    file: 'engine/core-modules/application/application-marketplace/marketplace-public.resolver.ts',
    control: 'listed-only sanitized catalog DTOs, no secrets',
  },
  {
    file: 'engine/core-modules/client-config/client-config.controller.ts',
    control: 'curated public-safe config (flags, publishable keys only)',
  },
  {
    file: 'engine/core-modules/open-api/open-api.controller.ts',
    control: 'workspace paths require valid access token; base schema only',
  },
];

const collectSourceFiles = (directory: string): string[] => {
  const entries = readdirSync(directory);

  return entries.flatMap((entry) => {
    const fullPath = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')
      ? [fullPath]
      : [];
  });
};

describe('PublicEndpointGuard inventory', () => {
  it('should only be used in allowlisted files with a documented control', () => {
    const sourceRoot = join(__dirname, '..', '..', '..');
    const selfRelativePath = relative(sourceRoot, __filename);

    const publicFiles = collectSourceFiles(sourceRoot)
      .map((fullPath) => relative(sourceRoot, fullPath))
      .filter(
        (relativePath) =>
          relativePath !== selfRelativePath &&
          relativePath !== join('engine', 'guards', 'public-endpoint.guard.ts'),
      )
      .filter((relativePath) =>
        readFileSync(join(sourceRoot, relativePath), 'utf8').includes(
          'PublicEndpointGuard',
        ),
      )
      .sort();

    const allowlistedFiles = PUBLIC_ENDPOINT_ALLOWLIST.map(
      (entry) => entry.file,
    ).sort();

    const unregistered = publicFiles.filter(
      (file) => !allowlistedFiles.includes(file),
    );
    const stale = allowlistedFiles.filter(
      (file) => !publicFiles.includes(file),
    );

    expect(unregistered).toEqual([]);
    expect(stale).toEqual([]);
  });
});
