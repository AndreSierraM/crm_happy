import { useHandleResetPassword } from '@/auth/sign-in-up/hooks/useHandleResetPassword';
import { currentUserState } from '@/auth/states/currentUserState';
import { ChangePasswordForm } from '@/settings/profile/components/ChangePasswordForm';
import { useCanChangePassword } from '@/settings/profile/hooks/useCanChangePassword';
import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/components/layout';
import { Button } from 'twenty-ui/primitives/input';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type ReactNode } from 'react';

type PasswordSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const PasswordSection = ({
  title,
  description,
  children,
}: PasswordSectionProps) => (
  <>
    <Section.Header title={title} description={description} />
    {children}
  </>
);

export const SetOrChangePassword = () => {
  const { t } = useLingui();
  const currentUser = useAtomStateValue(currentUserState);
  const { canChangePassword } = useCanChangePassword();

  const { handleResetPassword } = useHandleResetPassword();

  const hasPassword = currentUser?.hasPassword ?? false;
  const heading = hasPassword ? t`Change Password` : t`Set Password`;

  if (!canChangePassword) {
    return (
      <PasswordSection
        title={heading}
        description={t`Password authentication is disabled for this workspace`}
      >
        <Button variant="outline" disabled>
          {heading}
        </Button>
      </PasswordSection>
    );
  }

  if (!hasPassword) {
    return (
      <PasswordSection
        title={heading}
        description={t`Receive an email containing password set link`}
      >
        <Button onClick={handleResetPassword()} variant="outline">
          {heading}
        </Button>
      </PasswordSection>
    );
  }

  return (
    <PasswordSection
      title={heading}
      description={t`Enter your current password to set a new one`}
    >
      <ChangePasswordForm />
    </PasswordSection>
  );
};
