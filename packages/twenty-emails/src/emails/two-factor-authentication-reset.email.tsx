import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type TwoFactorAuthenticationResetEmailProps = {
  workspaceDisplayName: string;
  locale: keyof typeof APP_LOCALES;
};

export const TwoFactorAuthenticationResetEmail = ({
  workspaceDisplayName,
  locale,
}: TwoFactorAuthenticationResetEmailProps) => {
  const i18n = createI18nInstance(locale);

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Verificación en dos pasos restablecida')} />
      <MainText>
        <Trans
          id="Se usó un código de recuperación para entrar a {workspaceDisplayName}. Se eliminó tu autenticador de ese espacio de trabajo y se cerraron tus otras sesiones."
          values={{ workspaceDisplayName }}
        />
        <br />
        <br />
        <Trans id="Vuelve a configurar la verificación en dos pasos en Ajustes, Perfil." />
        <br />
        <br />
        <Trans id="Si no fuiste tú, contacta al administrador de tu espacio de trabajo y cambia tu contraseña." />
        <br />
      </MainText>
      <br />
      <br />
    </BaseEmail>
  );
};

TwoFactorAuthenticationResetEmail.PreviewProps = {
  workspaceDisplayName: 'Acme',
  locale: 'en',
} as TwoFactorAuthenticationResetEmailProps;

export default TwoFactorAuthenticationResetEmail;
