import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { PublicDomainEntity } from 'src/engine/core-modules/public-domain/public-domain.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';

import { WorkspaceDomainsService } from './workspace-domains.service';

describe('WorkspaceDomainsService', () => {
  let service: WorkspaceDomainsService;

  const twentyConfigServiceMock = { get: jest.fn() };
  const domainServerConfigServiceMock = {
    getSubdomainAndCustomDomainFromUrl: jest.fn(),
  };
  const workspaceRepositoryMock = {
    findOne: jest.fn(),
    exists: jest.fn(),
    count: jest.fn(),
  };

  const defaultWorkspace = { id: 'default-workspace-id' } as WorkspaceEntity;
  const memberWorkspace = { id: 'member-workspace-id' } as WorkspaceEntity;
  const seedWorkspace = { id: SEED_APPLE_WORKSPACE_ID } as WorkspaceEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceDomainsService,
        {
          provide: DomainServerConfigService,
          useValue: domainServerConfigServiceMock,
        },
        { provide: TwentyConfigService, useValue: twentyConfigServiceMock },
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useValue: workspaceRepositoryMock,
        },
        {
          provide: getRepositoryToken(PublicDomainEntity),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WorkspaceDomainsService>(WorkspaceDomainsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaceForUserLogin', () => {
    it('resolves by origin when multi-workspace is enabled', async () => {
      twentyConfigServiceMock.get.mockReturnValue(true);
      domainServerConfigServiceMock.getSubdomainAndCustomDomainFromUrl.mockReturnValue(
        {
          subdomain: 'acme',
          customDomain: undefined,
          isUnderPublicDomainUrl: false,
        },
      );
      workspaceRepositoryMock.findOne.mockResolvedValue(memberWorkspace);

      await expect(
        service.getWorkspaceForUserLogin('https://acme.app.com', 'user-id'),
      ).resolves.toBe(memberWorkspace);
      expect(workspaceRepositoryMock.exists).not.toHaveBeenCalled();
    });

    it('returns the default workspace when the user is a member of it', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.count.mockResolvedValue(2);
      workspaceRepositoryMock.findOne.mockImplementation(
        async (options?: { where?: { id?: string } }) =>
          options?.where?.id === SEED_APPLE_WORKSPACE_ID
            ? null
            : defaultWorkspace,
      );
      workspaceRepositoryMock.exists.mockResolvedValue(true);

      await expect(
        service.getWorkspaceForUserLogin('https://app.com', 'user-id'),
      ).resolves.toBe(defaultWorkspace);
    });

    it('returns a member workspace when the user is not a member of the default workspace', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.count.mockResolvedValue(2);
      workspaceRepositoryMock.findOne.mockImplementation(
        async (options?: {
          where?: { id?: string; workspaceUsers?: object };
        }) => {
          if (options?.where?.workspaceUsers) {
            return memberWorkspace;
          }

          return options?.where?.id === SEED_APPLE_WORKSPACE_ID
            ? null
            : defaultWorkspace;
        },
      );
      workspaceRepositoryMock.exists.mockResolvedValue(false);

      await expect(
        service.getWorkspaceForUserLogin('https://app.com', 'user-id'),
      ).resolves.toBe(memberWorkspace);
    });

    it('falls back to the default workspace for non-members with pending invitations', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.count.mockResolvedValue(2);
      workspaceRepositoryMock.findOne.mockImplementation(
        async (options?: {
          where?: { id?: string; workspaceUsers?: object };
        }) => {
          if (options?.where?.workspaceUsers) {
            return null;
          }

          return options?.where?.id === SEED_APPLE_WORKSPACE_ID
            ? null
            : defaultWorkspace;
        },
      );
      workspaceRepositoryMock.exists.mockResolvedValue(false);

      await expect(
        service.getWorkspaceForUserLogin('https://app.com', 'user-id'),
      ).resolves.toBe(defaultWorkspace);
    });

    it('prefers the seed workspace as default when present', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.count.mockResolvedValue(3);
      workspaceRepositoryMock.findOne.mockResolvedValue(seedWorkspace);
      workspaceRepositoryMock.exists.mockResolvedValue(true);

      await expect(
        service.getWorkspaceForUserLogin('https://app.com', 'user-id'),
      ).resolves.toBe(seedWorkspace);
      expect(workspaceRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasMultipleWorkspaces', () => {
    it('returns true when more than one workspace exists', async () => {
      workspaceRepositoryMock.count.mockResolvedValue(2);

      await expect(service.hasMultipleWorkspaces()).resolves.toBe(true);
    });

    it('returns false when a single workspace exists', async () => {
      workspaceRepositoryMock.count.mockResolvedValue(1);

      await expect(service.hasMultipleWorkspaces()).resolves.toBe(false);
    });
  });

  describe('getWorkspaceForToken', () => {
    it('returns the token workspace in single-workspace mode', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.findOne.mockResolvedValue(memberWorkspace);

      await expect(
        service.getWorkspaceForToken('https://app.com', memberWorkspace.id),
      ).resolves.toBe(memberWorkspace);
    });

    it('returns undefined when the token workspace does not exist', async () => {
      twentyConfigServiceMock.get.mockReturnValue(false);
      workspaceRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.getWorkspaceForToken('https://app.com', 'missing-id'),
      ).resolves.toBeUndefined();
    });

    it('returns undefined on origin mismatch when multi-workspace is enabled', async () => {
      twentyConfigServiceMock.get.mockReturnValue(true);
      jest
        .spyOn(service, 'getWorkspaceByOriginOrDefaultWorkspace')
        .mockResolvedValue(defaultWorkspace);

      await expect(
        service.getWorkspaceForToken('https://acme.app.com', 'other-id'),
      ).resolves.toBeUndefined();
    });
  });
});
