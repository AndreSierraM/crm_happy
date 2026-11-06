import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import {
  compareHash,
  hashPassword,
} from 'src/engine/core-modules/auth/auth.util';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { AuthService } from './auth.service';

jest.mock('src/engine/core-modules/auth/auth.util', () => ({
  ...jest.requireActual('src/engine/core-modules/auth/auth.util'),
  hashPassword: jest.fn(),
  compareHash: jest.fn(),
}));

jest.mock('twenty-emails', () => ({
  ...jest.requireActual('twenty-emails'),
  renderEmail: jest.fn().mockResolvedValue('email'),
}));

const compareHashMock = compareHash as jest.Mock;
const hashPasswordMock = hashPassword as jest.Mock;

describe('AuthService', () => {
  const userRepositoryMock = { findOne: jest.fn(), update: jest.fn() };
  const appTokenRepositoryMock = { update: jest.fn() };
  const userSessionServiceMock = { revokeAllSessionsForUser: jest.fn() };
  const emailServiceMock = { send: jest.fn() };
  const i18nServiceMock = { getI18nInstance: jest.fn() };
  const domainServerConfigServiceMock = { getBaseUrl: jest.fn() };
  const twentyConfigServiceMock = { get: jest.fn() };
  const permissionsServiceMock = {
    userHasWorkspaceSettingPermission: jest.fn(),
  };

  const buildService = () =>
    new AuthService(
      {} as never,
      {} as never,
      {} as never,
      domainServerConfigServiceMock as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      permissionsServiceMock as never,
      {} as never,
      userRepositoryMock as never,
      twentyConfigServiceMock as never,
      emailServiceMock as never,
      appTokenRepositoryMock as never,
      i18nServiceMock as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      userSessionServiceMock as never,
    );

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'current-hash',
    userWorkspaces: [{ workspaceId: 'workspace-id', locale: 'en' }],
  } as unknown as UserEntity;

  const mockWorkspace = {
    id: 'workspace-id',
    isPasswordAuthEnabled: true,
    isPasswordAuthBypassEnabled: false,
  } as WorkspaceEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    twentyConfigServiceMock.get.mockReturnValue('test');
    domainServerConfigServiceMock.getBaseUrl.mockReturnValue(
      new URL('https://app.com'),
    );
    i18nServiceMock.getI18nInstance.mockReturnValue({ _: () => 'subject' });
  });

  describe('updatePasswordWithCurrentPassword', () => {
    it('should update the password and revoke sessions when the current password is valid', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      compareHashMock.mockResolvedValue(true);
      hashPasswordMock.mockResolvedValue('new-hash');

      const result = await buildService().updatePasswordWithCurrentPassword({
        userId: mockUser.id,
        workspace: mockWorkspace,
        currentPassword: 'current-password',
        newPassword: 'new-password-1',
      });

      expect(result).toEqual({ success: true });
      expect(compareHashMock).toHaveBeenCalledWith(
        'current-password',
        'current-hash',
      );
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser.id, {
        passwordHash: 'new-hash',
      });
      expect(
        userSessionServiceMock.revokeAllSessionsForUser,
      ).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.id }));
      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: mockUser.email }),
      );
    });

    it('should throw when password auth is disabled without bypass', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);

      await expect(
        buildService().updatePasswordWithCurrentPassword({
          userId: mockUser.id,
          workspace: {
            ...mockWorkspace,
            isPasswordAuthEnabled: false,
          } as WorkspaceEntity,
          currentPassword: 'current-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toThrow(
        new AuthException(
          'Email/Password auth is not enabled for this workspace',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        ),
      );
      expect(compareHashMock).not.toHaveBeenCalled();
    });

    it('should throw when the user has no password set', async () => {
      userRepositoryMock.findOne.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(
        buildService().updatePasswordWithCurrentPassword({
          userId: mockUser.id,
          workspace: mockWorkspace,
          currentPassword: 'current-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toThrow(
        new AuthException(
          'Incorrect login method',
          AuthExceptionCode.INVALID_INPUT,
        ),
      );
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should throw when the current password is wrong', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      compareHashMock.mockResolvedValue(false);

      await expect(
        buildService().updatePasswordWithCurrentPassword({
          userId: mockUser.id,
          workspace: mockWorkspace,
          currentPassword: 'wrong-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toThrow(
        new AuthException(
          'Wrong password',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        ),
      );
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should throw when the new password is too weak', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);
      compareHashMock.mockResolvedValue(true);

      await expect(
        buildService().updatePasswordWithCurrentPassword({
          userId: mockUser.id,
          workspace: mockWorkspace,
          currentPassword: 'current-password',
          newPassword: '123',
        }),
      ).rejects.toThrow(
        new AuthException(
          'Password is too weak',
          AuthExceptionCode.INVALID_INPUT,
        ),
      );
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('findUserByEmailForPasswordLoginOrThrow', () => {
    it('should return the user when the email exists', async () => {
      userRepositoryMock.findOne.mockResolvedValue(mockUser);

      await expect(
        buildService().findUserByEmailForPasswordLoginOrThrow(mockUser.email),
      ).resolves.toBe(mockUser);
    });

    it('should throw the wrong-password error when the email is unknown', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        buildService().findUserByEmailForPasswordLoginOrThrow(
          'unknown@example.com',
        ),
      ).rejects.toThrow(
        new AuthException(
          'Wrong password',
          AuthExceptionCode.FORBIDDEN_EXCEPTION,
        ),
      );
    });
  });
});
