import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BillingSubscriptionRenewingEmailProps = {
  userName: string;
  workspaceDisplayName: string | undefined;
  renewsAt: Date;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

// Sent 7 days before a yearly renewal, as auto-renewal laws in several regions expect; monthly plans get none.
export const BillingSubscriptionRenewingEmail = ({
  userName,
  workspaceDisplayName,
  renewsAt,
  link,
  locale,
}: BillingSubscriptionRenewingEmailProps) => {
  const i18n = createI18nInstance('es-ES');
  const formattedDate = i18n.date(renewsAt, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Tu plan se renueva pronto')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans id="Para que nunca te tome por sorpresa, te avisamos sobre tu plan anual." />
        <br />
        <br />
        <Trans
          id="Tu plan anual de <0>{workspaceDisplayName}</0> se renueva el {formattedDate}."
          values={{ workspaceDisplayName, formattedDate }}
          components={{ 0: <b /> }}
        />
        <br />
        <br />
        <Trans id="Si quieres continuar, no tienes que hacer nada. Si prefieres no renovar, puedes cancelar cuando quieras antes de esa fecha." />
      </MainText>
      <br />
      <CallToAction href={link} value={i18n._('Gestionar suscripción')} />
      <br />
      <br />
    </BaseEmail>
  );
};

BillingSubscriptionRenewingEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceDisplayName: 'Acme Inc.',
  renewsAt: new Date('2027-07-02'),
  link: 'https://acme.happy.local/settings/billing',
  locale: 'en',
} as BillingSubscriptionRenewingEmailProps;

export default BillingSubscriptionRenewingEmail;
