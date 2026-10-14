import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BillingTrialConvertingEmailProps = {
  userName: string;
  workspaceDisplayName: string | undefined;
  trialEndsAt: Date;
  interval: 'month' | 'year';
  link: string;
  locale: keyof typeof APP_LOCALES;
};

// Sent 7 days before a carded trial converts, so the first charge is never a surprise.
export const BillingTrialConvertingEmail = ({
  userName,
  workspaceDisplayName,
  trialEndsAt,
  interval,
  link,
  locale,
}: BillingTrialConvertingEmailProps) => {
  const i18n = createI18nInstance(locale);
  const formattedDate = i18n.date(trialEndsAt, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Un aviso antes de que termine tu prueba')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans id="No nos gustan los cargos sorpresa, así que te avisamos con tiempo." />
        <br />
        <br />
        {interval === 'year' ? (
          <Trans
            id="Tu prueba gratis de <0>{workspaceDisplayName}</0> termina el {formattedDate}. Si no cancelas antes, se cobrará tu plan anual a la tarjeta registrada."
            values={{ workspaceDisplayName, formattedDate }}
            components={{ 0: <b /> }}
          />
        ) : (
          <Trans
            id="Tu prueba gratis de <0>{workspaceDisplayName}</0> termina el {formattedDate}. Si no cancelas antes, se cobrará tu plan mensual a la tarjeta registrada."
            values={{ workspaceDisplayName, formattedDate }}
            components={{ 0: <b /> }}
          />
        )}
        <br />
        <br />
        <Trans id="Si Happy CRM te funciona, ya está todo listo y no tienes que hacer nada. Si no es para ti, cancela con un clic antes de esa fecha y no se te cobrará nada." />
      </MainText>
      <br />
      <CallToAction href={link} value={i18n._('Gestionar suscripción')} />
      <br />
      <br />
    </BaseEmail>
  );
};

BillingTrialConvertingEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceDisplayName: 'Acme Inc.',
  trialEndsAt: new Date('2026-07-02'),
  interval: 'month',
  link: 'https://acme.happy.local/settings/billing',
  locale: 'en',
} as BillingTrialConvertingEmailProps;

export default BillingTrialConvertingEmail;
