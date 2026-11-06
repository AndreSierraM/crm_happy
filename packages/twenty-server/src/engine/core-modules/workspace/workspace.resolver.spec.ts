import {
  IdentityProviderType,
  SsoIdentityProviderStatus,
} from 'src/engine/core-modules/sso/workspace-sso-identity-provider.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { WorkspaceResolver } from './workspace.resolver';

describe('WorkspaceResolver', () => {
  const workspaceDomainsService = {
    getWorkspaceByOriginOrDefaultWorkspace: jest.fn(),
    getWorkspaceUrls: jest.fn(),
    hasMultipleWorkspaces: jest.fn(),
  };
  const twentyConfigService = { get: jest.fn() };
  const fileUrlService = { signFileByIdUrl: jest.fn() };

  const resolver = new WorkspaceResolver(
    {} as never,
    workspaceDomainsService as never,
    {} as never,
    twentyConfigService as never,
    fileUrlService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const defaultWorkspace = {
    id: 'f0d2c5a1-6b3e-4a7d-9c1f-2e5b8d4a6c01',
    displayName: 'Company A',
    logoFileId: 'logo-file-id',
    isGoogleAuthEnabled: true,
    isPasswordAuthEnabled: true,
    isMicrosoftAuthEnabled: true,
    isGoogleAuthBypassEnabled: false,
    isPasswordAuthBypassEnabled: false,
    isMicrosoftAuthBypassEnabled: false,
    workspaceSsoIdentityProviders: [
      {
        id: 'sso-id',
        name: 'Company A SSO',
        type: IdentityProviderType.OIDC,
        status: SsoIdentityProviderStatus.Active,
        issuer: 'https://sso.company-a.com',
      },
    ],
  } as WorkspaceEntity;

  const setSystemConfig = (isMultiWorkspaceEnabled: boolean) => {
    twentyConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'IS_MULTIWORKSPACE_ENABLED':
          return isMultiWorkspaceEnabled;
        case 'AUTH_GOOGLE_ENABLED':
          return true;
        case 'AUTH_PASSWORD_ENABLED':
          return true;
        case 'AUTH_MICROSOFT_ENABLED':
          return false;
        default:
          return undefined;
      }
    });
  };

  beforeEach(() => {
    workspaceDomainsService.getWorkspaceByOriginOrDefaultWorkspace.mockResolvedValue(
      defaultWorkspace,
    );
    workspaceDomainsService.getWorkspaceUrls.mockReturnValue({
      subdomainUrl: 'https://app.happycrm.com',
      customUrl: 'https://company-a.com',
    });
    fileUrlService.signFileByIdUrl.mockResolvedValue('signed-logo-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicWorkspaceDataByDomain', () => {
    it('returns neutral branding when several workspaces share single-workspace mode', async () => {
      setSystemConfig(false);
      workspaceDomainsService.hasMultipleWorkspaces.mockResolvedValue(true);

      const result = await resolver.getPublicWorkspaceDataByDomain(
        'https://app.happycrm.com',
        'https://app.happycrm.com',
      );

      expect(result).toEqual({
        id: defaultWorkspace.id,
        logo: undefined,
        displayName: undefined,
        workspaceUrls: {
          subdomainUrl: 'https://app.happycrm.com',
          customUrl: undefined,
        },
        authProviders: {
          google: true,
          magicLink: false,
          password: true,
          microsoft: false,
          sso: [
            {
              id: 'sso-id',
              name: 'Company A SSO',
              type: IdentityProviderType.OIDC,
              status: SsoIdentityProviderStatus.Active,
              issuer: 'https://sso.company-a.com',
            },
          ],
        },
        authBypassProviders: {
          google: false,
          password: false,
          microsoft: false,
        },
      });
      expect(fileUrlService.signFileByIdUrl).not.toHaveBeenCalled();
    });

    it('returns default workspace branding when a single workspace exists', async () => {
      setSystemConfig(false);
      workspaceDomainsService.hasMultipleWorkspaces.mockResolvedValue(false);

      const result = await resolver.getPublicWorkspaceDataByDomain(
        'https://app.happycrm.com',
        'https://app.happycrm.com',
      );

      expect(result).toEqual({
        id: defaultWorkspace.id,
        logo: 'signed-logo-url',
        displayName: 'Company A',
        workspaceUrls: {
          subdomainUrl: 'https://app.happycrm.com',
          customUrl: 'https://company-a.com',
        },
        authProviders: {
          google: true,
          magicLink: false,
          password: true,
          microsoft: false,
          sso: [
            {
              id: 'sso-id',
              name: 'Company A SSO',
              type: IdentityProviderType.OIDC,
              status: SsoIdentityProviderStatus.Active,
              issuer: 'https://sso.company-a.com',
            },
          ],
        },
        authBypassProviders: {
          google: false,
          password: false,
          microsoft: false,
        },
      });
    });

    it('returns workspace branding without counting workspaces when multi-workspace is enabled', async () => {
      setSystemConfig(true);

      const result = await resolver.getPublicWorkspaceDataByDomain(
        'https://company-a.happycrm.com',
        'https://company-a.happycrm.com',
      );

      expect(result?.displayName).toBe('Company A');
      expect(
        workspaceDomainsService.hasMultipleWorkspaces,
      ).not.toHaveBeenCalled();
    });
  });
});
