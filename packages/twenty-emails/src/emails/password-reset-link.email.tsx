import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { Link } from 'src/components/Link';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type PasswordResetLinkEmailProps = {
  duration: string;
  hasPassword: boolean;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

export const PasswordResetLinkEmail = ({
  duration,
  hasPassword,
  link,
  locale,
}: PasswordResetLinkEmailProps) => {
  const i18n = createI18nInstance(locale);
  const headline = hasPassword
    ? i18n._('Restablece tu contraseña 🗝')
    : i18n._('Crea tu contraseña 🗝');
  const ctaLabel = hasPassword ? i18n._('Restablecer') : i18n._('Crear');

  return (
    <BaseEmail locale={locale}>
      <Title value={headline} />
      <MainText>
        <Trans
          id="Este enlace solo es válido durante {duration}. Si no funciona, copia y pega esta dirección en tu navegador:"
          values={{ duration }}
        />
        <br />
        <Link href={link} value={link} />
      </MainText>
      <br />
      <CallToAction href={link} value={ctaLabel} />
      <br />
      <br />
    </BaseEmail>
  );
};

PasswordResetLinkEmail.PreviewProps = {
  duration: '24 hours',
  hasPassword: true,
  link: 'https://app.happy.local/reset-password/123',
  locale: 'en',
} as PasswordResetLinkEmailProps;

export default PasswordResetLinkEmail;
