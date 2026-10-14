import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

type CleanSuspendedWorkspaceEmailProps = {
  daysSinceInactive: number;
  userName: string;
  workspaceDisplayName: string | undefined;
  locale: keyof typeof APP_LOCALES;
};

export const CleanSuspendedWorkspaceEmail = ({
  daysSinceInactive,
  userName,
  workspaceDisplayName,
  locale,
}: CleanSuspendedWorkspaceEmailProps) => {
  const i18n = createI18nInstance(locale);

  return (
    <BaseEmail locale={locale}>
      <Title value={i18n._('Tu espacio de trabajo fue eliminado')} />
      <MainText>
        {userName?.length > 1 ? (
          <Trans id="Hola {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hola," />
        )}
        <br />
        <br />
        <Trans
          id="Tu espacio de trabajo <0>{workspaceDisplayName}</0> fue eliminado definitivamente: llevaba en pausa {daysSinceInactive} días y no se reactivó a tiempo."
          values={{ workspaceDisplayName, daysSinceInactive }}
          components={{ 0: <b /> }}
        />
        <br />
        <br />
        <Trans id="Sus datos fueron eliminados y ya no se pueden recuperar." />
        <br />
        <br />
        <Trans id="Si algún día quieres volver a Happy CRM, puedes crear un espacio de trabajo nuevo en minutos. ¡Aquí te esperamos!" />
      </MainText>
      <br />
      <CallToAction
        href="https://app.happy.local/"
        value={i18n._('Crear un espacio de trabajo')}
      />
      <br />
      <br />
    </BaseEmail>
  );
};

CleanSuspendedWorkspaceEmail.PreviewProps = {
  daysSinceInactive: 1,
  userName: 'John Doe',
  workspaceDisplayName: 'My Workspace',
  locale: 'en',
};

export default CleanSuspendedWorkspaceEmail;
