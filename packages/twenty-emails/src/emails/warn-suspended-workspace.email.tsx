import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type WarnSuspendedWorkspaceEmailProps = {
  daysSinceInactive: number;
  inactiveDaysBeforeDelete: number;
  userName: string;
  workspaceDisplayName: string | undefined;
  link: string;
  locale: keyof typeof APP_LOCALES;
};

export const WarnSuspendedWorkspaceEmail = ({
  daysSinceInactive,
  inactiveDaysBeforeDelete,
  userName,
  workspaceDisplayName,
  link,
  locale,
}: WarnSuspendedWorkspaceEmailProps) => {
  const i18n = createI18nInstance(locale);
  const daysLeft = inactiveDaysBeforeDelete - daysSinceInactive;
  const dayOrDays = daysLeft > 1 ? 'días' : 'día';
  const remainingDays = daysLeft > 0 ? daysLeft : 0;

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Tu espacio de trabajo está en pausa')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans
          id="Primero lo bueno: tu espacio de trabajo <0>{workspaceDisplayName}</0> solo está en pausa, no se perdió nada."
          values={{ workspaceDisplayName }}
          components={{ 0: <b /> }}
        />
        <br />
        <br />
        <Trans
          id="Reactívalo en los próximos {remainingDays} {dayOrDays} y seguirás donde quedaste, con cada registro, vista y ajuste en su lugar."
          values={{ remainingDays, dayOrDays }}
        />
        <br />
        <br />
        <Trans id="Después de eso, el espacio de trabajo y todos sus datos se eliminarán para siempre, sin posibilidad de recuperarlos." />
      </MainText>
      <br />
      <CallToAction href={link} value={i18n._('Reactivar espacio de trabajo')} />
      <br />
      <br />
    </BaseEmail>
  );
};

WarnSuspendedWorkspaceEmail.PreviewProps = {
  daysSinceInactive: 10,
  inactiveDaysBeforeDelete: 14,
  userName: 'John Doe',
  workspaceDisplayName: 'Acme Inc.',
  link: 'https://acme.happy.local/settings/billing',
  locale: 'en',
};

export default WarnSuspendedWorkspaceEmail;
