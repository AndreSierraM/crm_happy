import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type PasswordUpdateNotifyEmailProps = {
  userName: string;
  email: string;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

export const PasswordUpdateNotifyEmail = ({
  userName,
  email,
  link,
  locale,
}: PasswordUpdateNotifyEmailProps) => {
  const i18n = createI18nInstance(locale);
  const formattedDate = i18n.date(new Date());

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Contraseña actualizada')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans
          id="Te confirmamos que la contraseña de tu cuenta ({email}) se cambió correctamente el {formattedDate}."
          values={{ email, formattedDate }}
        />
        <br />
        <br />
        <Trans id="Si no fuiste tú quien hizo este cambio, avisa de inmediato al propietario de tu espacio de trabajo." />
        <br />
      </MainText>
      <br />
      <CallToAction value={i18n._('Entrar a Happy CRM')} href={link} />
      <br />
      <br />
    </BaseEmail>
  );
};

PasswordUpdateNotifyEmail.PreviewProps = {
  userName: 'John Doe',
  email: 'john.doe@example.com',
  link: 'https://app.happy.local',
  locale: 'en',
} as PasswordUpdateNotifyEmailProps;

export default PasswordUpdateNotifyEmail;
