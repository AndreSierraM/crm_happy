import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type SendEmailVerificationLinkEmailProps = {
  link: string;
  locale: keyof typeof APP_LOCALES;
  isEmailUpdate?: boolean;
};

export const SendEmailVerificationLinkEmail = ({
  link,
  locale,
  isEmailUpdate = false,
}: SendEmailVerificationLinkEmailProps) => {
  const i18n = createI18nInstance(locale);
  const title = isEmailUpdate
    ? i18n._('Confirma tu nuevo correo electrónico')
    : i18n._('Confirma tu correo electrónico');
  const bodyId = isEmailUpdate
    ? 'Recibimos una solicitud para cambiar el correo de tu cuenta de Happy CRM. Haz clic abajo para confirmar el cambio.'
    : '¡Gracias por crear tu cuenta en Happy CRM! Antes de empezar, solo necesitamos confirmar que eres tú. Haz clic abajo para verificar tu correo.';
  const ctaLabel = isEmailUpdate
    ? i18n._('Confirmar correo')
    : i18n._('Verificar correo');

  return (
    <BaseEmail locale={locale}>
      <Title value={title} />
      <MainText>
        <Trans id={bodyId} />
      </MainText>
      <br />
      <CallToAction href={link} value={ctaLabel} />
      <br />
      <br />
    </BaseEmail>
  );
};

SendEmailVerificationLinkEmail.PreviewProps = {
  link: 'https://app.happy.local/verify-email/123',
  locale: 'en',
  isEmailUpdate: false,
};

export default SendEmailVerificationLinkEmail;
