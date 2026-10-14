import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type TwoFactorAuthenticationRecoveryCodeIssuedEmailProps = {
  actorName: string;
  workspaceDisplayName: string;
  expiresAt: Date;
  locale: keyof typeof APP_LOCALES;
};

export const TwoFactorAuthenticationRecoveryCodeIssuedEmail = ({
  actorName,
  workspaceDisplayName,
  expiresAt,
  locale,
}: TwoFactorAuthenticationRecoveryCodeIssuedEmailProps) => {
  const i18n = createI18nInstance(locale);
  const formattedExpiresAt = i18n.date(expiresAt, {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'UTC',
  });

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Código de recuperación emitido')} />
      <MainText>
        <Trans
          id="{actorName} generó un código de recuperación para entrar a {workspaceDisplayName} sin tu app de autenticación."
          values={{ actorName, workspaceDisplayName }}
        />
        <br />
        <br />
        <Trans
          id="El código es de un solo uso y vence el {formattedExpiresAt}. Al usarlo se elimina tu autenticador actual y se cierran tus otras sesiones."
          values={{ formattedExpiresAt }}
        />
        <br />
        <br />
        <Trans id="Si no lo pediste tú, contacta al administrador de tu espacio de trabajo y cambia tu contraseña." />
        <br />
      </MainText>
      <br />
      <br />
    </BaseEmail>
  );
};

TwoFactorAuthenticationRecoveryCodeIssuedEmail.PreviewProps = {
  actorName: 'John Doe',
  workspaceDisplayName: 'Acme',
  expiresAt: new Date('2026-07-02T10:00:00Z'),
  locale: 'en',
} as TwoFactorAuthenticationRecoveryCodeIssuedEmailProps;

export default TwoFactorAuthenticationRecoveryCodeIssuedEmail;
