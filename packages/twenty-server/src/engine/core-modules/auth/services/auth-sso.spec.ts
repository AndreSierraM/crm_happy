import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { type Repository } from 'typeorm';

import { AuthSsoService } from 'src/engine/core-modules/auth/services/auth-sso.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

describe('AuthSsoService', () => {
  let authSsoService: AuthSsoService;
  let workspaceRepository: Repository<WorkspaceEntity>;
  let twentyConfigService: TwentyConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSsoService,
        {
          provide: getRepositoryToken(WorkspaceEntity),
          useValue: {
            findOne: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authSsoService = module.get<AuthSsoService>(AuthSsoService);
    workspaceRepository = module.get<Repository<WorkspaceEntity>>(
      getRepositoryToken(WorkspaceEntity),
    );
    twentyConfigService = module.get<TwentyConfigService>(TwentyConfigService);
  });

  describe('findWorkspaceFromWorkspaceIdOrAuthProvider', () => {
    it('should return a workspace by workspaceId when multi-workspace mode is enabled', async () => {
      const workspaceId = 'workspace-id-123';
      const mockWorkspace = { id: workspaceId } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(true);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider(
          { authProvider: AuthProviderEnum.Google, email: 'test@example.com' },
          workspaceId,
        );

      expect(result).toEqual(mockWorkspace);
      expect(workspaceRepository.findOne).toHaveBeenCalledTimes(1);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: workspaceId,
        },
        relations: ['approvedAccessDomains'],
      });
      expect(workspaceRepository.exists).not.toHaveBeenCalled();
    });

    it('should return the workspace by id when the user is a member of it in single-workspace mode', async () => {
      const workspaceId = 'workspace-id-123';
      const mockWorkspace = { id: workspaceId } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(false);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);
      jest.spyOn(workspaceRepository, 'exists').mockResolvedValue(true);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider(
          { authProvider: AuthProviderEnum.Google, email: 'test@example.com' },
          workspaceId,
        );

      expect(result).toEqual(mockWorkspace);
      expect(workspaceRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should fall back to a member workspace in single-workspace mode', async () => {
      const mockWorkspace = { id: 'member-workspace-id' } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(false);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValueOnce({
          id: 'default-workspace-id',
        } as WorkspaceEntity)
        .mockResolvedValue(mockWorkspace);
      jest.spyOn(workspaceRepository, 'exists').mockResolvedValue(false);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider(
          { authProvider: AuthProviderEnum.Google, email: 'test@example.com' },
          'default-workspace-id',
        );

      expect(result).toEqual(mockWorkspace);
    });

    it('should always resolve by id for SSO in single-workspace mode', async () => {
      const workspaceId = 'sso-workspace-id';
      const mockWorkspace = { id: workspaceId } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(false);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider(
          { authProvider: AuthProviderEnum.SSO, email: 'test@example.com' },
          workspaceId,
        );

      expect(result).toEqual(mockWorkspace);
      expect(workspaceRepository.findOne).toHaveBeenCalledTimes(1);
      expect(workspaceRepository.exists).not.toHaveBeenCalled();
    });

    it('should fall back to the workspace by id for invited non-members in single-workspace mode', async () => {
      const mockWorkspace = { id: 'default-workspace-id' } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(false);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValueOnce(mockWorkspace)
        .mockResolvedValue(null);
      jest.spyOn(workspaceRepository, 'exists').mockResolvedValue(false);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider(
          { authProvider: AuthProviderEnum.Google, email: 'test@example.com' },
          'default-workspace-id',
        );

      expect(result).toEqual(mockWorkspace);
    });

    it('should return a workspace from authProvider and email when multi-workspace mode is enabled', async () => {
      const authProvider = AuthProviderEnum.Google;
      const email = 'test@example.com';
      const mockWorkspace = { id: 'workspace-id-456' } as WorkspaceEntity;

      jest.spyOn(twentyConfigService, 'get').mockReturnValue(true);
      jest
        .spyOn(workspaceRepository, 'findOne')
        .mockResolvedValue(mockWorkspace);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider({
          authProvider,
          email,
        });

      expect(result).toEqual(mockWorkspace);
      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: {
          isGoogleAuthEnabled: true,
          workspaceUsers: {
            user: {
              email,
            },
          },
        },
        relations: [
          'workspaceUsers',
          'workspaceUsers.user',
          'approvedAccessDomains',
        ],
      });
    });

    it('should return undefined if no workspace is found when multi-workspace mode is enabled', async () => {
      jest.spyOn(twentyConfigService, 'get').mockReturnValue(true);
      jest.spyOn(workspaceRepository, 'findOne').mockResolvedValue(null);

      const result =
        await authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider({
          authProvider: AuthProviderEnum.Google,
          email: 'notfound@example.com',
        });

      expect(result).toBeUndefined();
    });

    it('should throw an error for an invalid authProvider', async () => {
      jest.spyOn(twentyConfigService, 'get').mockReturnValue(true);

      await expect(
        authSsoService.findWorkspaceFromWorkspaceIdOrAuthProvider({
          authProvider: 'invalid-provider' as any,
          email: 'test@example.com',
        }),
      ).rejects.toThrow('invalid-provider is not a valid auth provider.');
    });
  });
});
