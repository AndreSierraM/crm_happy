import {
  currentUserState,
  type CurrentUser,
} from '@/auth/states/currentUserState';
import { currentUserWorkspaceState } from '@/auth/states/currentUserWorkspaceState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import { SetOrChangePassword } from '@/settings/profile/components/SetOrChangePassword';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import {
  OnboardingStatus,
  EmailPasswordResetLinkDocument,
  UpdatePasswordDocument,
} from '~/generated-metadata/graphql';
import { messages } from '~/locales/generated/en';
import { mockCurrentWorkspace } from '~/testing/mock-data/users';

i18n.load({
  [SOURCE_LOCALE]: messages,
});
i18n.activate(SOURCE_LOCALE);

const enqueueToast = jest.fn();
const mockSignInWithCredentialsInWorkspace = jest.fn();

jest.mock('twenty-ui/components/feedback', () => ({
  ...jest.requireActual('twenty-ui/components/feedback'),
  useToast: () => ({ enqueueToast }),
}));

jest.mock('@/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithCredentialsInWorkspace: mockSignInWithCredentialsInWorkspace,
    signInWithCredentials: jest.fn(),
  }),
}));

const mockCurrentUser: CurrentUser = {
  id: 'fake-user-id',
  email: 'fake@email.com',
  supportUserHash: null,
  canAccessFullAdminPanel: false,
  canImpersonate: false,
  onboardingStatus: OnboardingStatus.COMPLETED,
  previousOnboardingStatus: null,
  isWorkspaceCreator: false,
  userVars: {},
  firstName: 'fake-first-name',
  lastName: 'fake-last-name',
  hasPassword: true,
};

const renderPasswordSection = (mocks: MockedResponse[] = []) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>
      <JotaiProvider store={jotaiStore}>
        <I18nProvider i18n={i18n}>{children}</I18nProvider>
      </JotaiProvider>
    </MockedProvider>
  );

  return render(<SetOrChangePassword />, { wrapper: Wrapper });
};

describe('SetOrChangePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetJotaiStore();
    jotaiStore.set(clientConfigApiStatusState.atom, {
      isLoadedOnce: true,
      isLoading: false,
      isErrored: false,
      isSaved: true,
      error: undefined,
      data: undefined,
    });
    jotaiStore.set(currentUserState.atom, mockCurrentUser);
    jotaiStore.set(currentUserWorkspaceState.atom, {
      permissionFlags: [],
      twoFactorAuthenticationMethodSummary: [],
      objectsPermissions: [],
      isImpersonating: false,
    });
    jotaiStore.set(currentWorkspaceState.atom, {
      ...mockCurrentWorkspace,
      isPasswordAuthEnabled: true,
    });
  });

  it('changes the password directly when the user has one', async () => {
    renderPasswordSection([
      {
        request: {
          query: UpdatePasswordDocument,
          variables: {
            currentPassword: 'current-password-1',
            newPassword: 'new-password-1',
          },
        },
        result: {
          data: { updatePassword: { success: true } },
        },
      },
    ]);

    await userEvent.type(
      screen.getByPlaceholderText('Current Password'),
      'current-password-1',
    );
    await userEvent.type(
      screen.getByPlaceholderText('New Password'),
      'new-password-1',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Change Password' }),
    );

    await waitFor(() =>
      expect(mockSignInWithCredentialsInWorkspace).toHaveBeenCalledWith(
        mockCurrentUser.email,
        'new-password-1',
        undefined,
      ),
    );
    expect(enqueueToast).toHaveBeenCalledWith({
      status: 'success',
      children: 'Password has been updated',
    });
    expect(screen.getByPlaceholderText('Current Password')).toHaveValue('');
  });

  it('shows a success toast when re-login redirects to email verification', async () => {
    mockSignInWithCredentialsInWorkspace.mockRejectedValueOnce(
      new CombinedGraphQLErrors({
        errors: [
          {
            message: 'Email is not verified',
            extensions: {
              code: 'FORBIDDEN',
              subCode: 'EMAIL_NOT_VERIFIED',
            },
          },
        ],
        data: null,
      }),
    );

    renderPasswordSection([
      {
        request: {
          query: UpdatePasswordDocument,
          variables: {
            currentPassword: 'current-password-1',
            newPassword: 'new-password-1',
          },
        },
        result: {
          data: { updatePassword: { success: true } },
        },
      },
    ]);

    await userEvent.type(
      screen.getByPlaceholderText('Current Password'),
      'current-password-1',
    );
    await userEvent.type(
      screen.getByPlaceholderText('New Password'),
      'new-password-1',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Change Password' }),
    );

    await waitFor(() =>
      expect(enqueueToast).toHaveBeenCalledWith({
        status: 'success',
        children: 'Password has been updated',
      }),
    );
    expect(enqueueToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
    expect(screen.getByPlaceholderText('Current Password')).toHaveValue('');
  });

  it('shows a validation error for a weak new password', async () => {
    renderPasswordSection();

    await userEvent.type(
      screen.getByPlaceholderText('Current Password'),
      'current-password-1',
    );
    await userEvent.type(screen.getByPlaceholderText('New Password'), '123');
    await userEvent.click(
      screen.getByRole('button', { name: 'Change Password' }),
    );

    expect(
      await screen.findByText('Password must be between 8 and 50 characters'),
    ).toBeInTheDocument();
    expect(enqueueToast).not.toHaveBeenCalled();
    expect(mockSignInWithCredentialsInWorkspace).not.toHaveBeenCalled();
  });

  it('sends a set link when the user has no password', async () => {
    jotaiStore.set(currentUserState.atom, {
      ...mockCurrentUser,
      hasPassword: false,
    });

    renderPasswordSection([
      {
        request: {
          query: EmailPasswordResetLinkDocument,
          variables: {
            email: mockCurrentUser.email,
            captchaToken: undefined,
          },
        },
        result: {
          data: { emailPasswordResetLink: { success: true } },
        },
      },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Set Password' }));

    await waitFor(() =>
      expect(enqueueToast).toHaveBeenCalledWith({
        status: 'success',
        children:
          'If this email is registered, a password reset link has been sent',
      }),
    );
  });

  it('shows a disabled explanation when password auth is disabled', async () => {
    jotaiStore.set(currentWorkspaceState.atom, {
      ...mockCurrentWorkspace,
      isPasswordAuthEnabled: false,
    });

    renderPasswordSection();

    const button = screen.getByRole('button', { name: 'Change Password' });
    expect(button).toBeDisabled();
    expect(
      screen.getByText(
        'Password authentication is disabled for this workspace',
      ),
    ).toBeInTheDocument();

    await userEvent.click(button);

    expect(enqueueToast).not.toHaveBeenCalled();
  });
});
