import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type BillingTrialEndingEmailProps = {
  userName: string;
  workspaceDisplayName: string | undefined;
  trialEndsAt: Date;
  dataRetentionDays: number;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

// Sent the day before a cardless trial ends; the risk is data loss, not a surprise charge.
export const BillingTrialEndingEmail = ({
  userName,
  workspaceDisplayName,
  trialEndsAt,
  dataRetentionDays,
  link,
  locale,
}: BillingTrialEndingEmailProps) => {
  const i18n = createI18nInstance(locale);
  const formattedDate = i18n.date(trialEndsAt, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Tu prueba termina pronto')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans
          id="Tu prueba gratis de <0>{workspaceDisplayName}</0> termina el {formattedDate}."
          values={{ workspaceDisplayName, formattedDate }}
          components={{ 0: <b /> }}
        />
        <br />
        <br />
        <Trans id="Para conservar tu espacio de trabajo y todo lo que construiste, agrega un método de pago y elige un plan." />
        <br />
        <br />
        <Trans
          id="Si no haces nada, pausaremos tu espacio de trabajo y cuidaremos tus datos por {dataRetentionDays} días por si cambias de opinión, sin cobrarte nada."
          values={{ dataRetentionDays }}
        />
      </MainText>
      <br />
      <CallToAction href={link} value={i18n._('Agregar método de pago')} />
      <br />
      <br />
    </BaseEmail>
  );
};

BillingTrialEndingEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceDisplayName: 'Acme Inc.',
  trialEndsAt: new Date('2026-07-02'),
  dataRetentionDays: 14,
  link: 'https://acme.happy.local/settings/billing',
  locale: 'en',
} as BillingTrialEndingEmailProps;

export default BillingTrialEndingEmail;
