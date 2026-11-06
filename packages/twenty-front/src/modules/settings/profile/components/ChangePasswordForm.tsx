import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { PASSWORD_REGEX } from '@/auth/utils/passwordRegex';
import { useReadCaptchaToken } from '@/captcha/hooks/useReadCaptchaToken';
import { useCaptcha } from '@/client-config/hooks/useCaptcha';
import { useIsCurrentLocationOnAWorkspace } from '@/domain-manager/hooks/useIsCurrentLocationOnAWorkspace';
import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { TextInput } from '@/ui/input/components/TextInput';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { styled } from '@linaria/react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Controller, useForm } from 'react-hook-form';
import { useToast } from 'twenty-ui/components/feedback';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import { z } from 'zod';
import { UpdatePasswordDocument } from '~/generated-metadata/graphql';
import { isGraphqlErrorOfType } from '~/utils/is-graphql-error-of-type.util';
import { logError } from '~/utils/logError';

const requiredMessage = msg`Current password is required`;
const passwordLengthMessage = msg`Password must be between 8 and 50 characters`;

const validationSchema = z.object({
  currentPassword: z.string().min(1, i18n._(requiredMessage)),
  newPassword: z.string().regex(PASSWORD_REGEX, i18n._(passwordLengthMessage)),
});

type ChangePasswordFormValues = z.infer<typeof validationSchema>;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

export const ChangePasswordForm = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const currentUser = useAtomStateValue(currentUserState);
  const { isOnAWorkspace } = useIsCurrentLocationOnAWorkspace();
  const { isCaptchaReady } = useCaptcha();
  const { readCaptchaToken } = useReadCaptchaToken();
  const { signInWithCredentialsInWorkspace, signInWithCredentials } = useAuth();

  const [updatePassword, { loading: isUpdatingPassword }] = useMutation(
    UpdatePasswordDocument,
  );

  const { control, handleSubmit, reset } = useForm<ChangePasswordFormValues>({
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '' },
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = async (formData: ChangePasswordFormValues) => {
    if (!isCaptchaReady) {
      enqueueToast({
        status: 'error',
        children: t`Captcha (anti-bot check) is still loading, try again`,
      });
      return;
    }

    try {
      const { data } = await updatePassword({
        variables: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
      });

      if (!data?.updatePassword.success) {
        enqueueToast({
          status: 'error',
          children: t`There was an error while updating password.`,
        });
        return;
      }

      // The server revokes every session on password change, so re-authenticate to keep this one alive.
      const token = readCaptchaToken();
      const email = currentUser?.email ?? '';

      if (isOnAWorkspace) {
        await signInWithCredentialsInWorkspace(
          email,
          formData.newPassword,
          token,
        );
      } else {
        await signInWithCredentials(email, formData.newPassword, token);
      }

      reset();
      enqueueToast({
        status: 'success',
        children: t`Password has been updated`,
      });
    } catch (error) {
      if (isGraphqlErrorOfType(error, 'EMAIL_NOT_VERIFIED')) {
        // Re-login already redirected to email verification; the password was changed.
        reset();
        enqueueToast({
          status: 'success',
          children: t`Password has been updated`,
        });
        return;
      }
      logError(error);
      enqueueToast(getToastOptionsFromError({ error }));
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="currentPassword"
        control={control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <TextInput
            value={value}
            type="password"
            placeholder={t`Current Password`}
            autoComplete="current-password"
            onBlur={onBlur}
            onChange={onChange}
            error={error?.message}
            fullWidth
          />
        )}
      />
      <Controller
        name="newPassword"
        control={control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <TextInput
            value={value}
            type="password"
            placeholder={t`New Password`}
            autoComplete="new-password"
            onBlur={onBlur}
            onChange={onChange}
            error={error?.message}
            fullWidth
          />
        )}
      />
      <Button
        type="submit"
        variant="outline"
        fullWidth
        loading={isUpdatingPassword}
      >
        {t`Change Password`}
      </Button>
    </StyledForm>
  );
};
