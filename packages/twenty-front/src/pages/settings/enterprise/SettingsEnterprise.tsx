import { Trans, useLingui } from '@lingui/react/macro';

import { SubscriptionInfoContainer } from '@/settings/billing/components/SubscriptionInfoContainer';
import { SubscriptionInfoRowContainer } from '@/settings/billing/components/internal/SubscriptionInfoRowContainer';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { IconCheck } from 'twenty-ui/icon';

type SettingsEnterpriseProps = {
  isAdminPanelTab?: boolean;
};

export const SettingsEnterprise = ({
  isAdminPanelTab = false,
}: SettingsEnterpriseProps = {}) => {
  const { t } = useLingui();

  const innerContent = (
    <Section.Root>
      <Section.Header
        title={t`Organization License`}
        description={t`All premium features are active (SSO, row-level security, and audit logs).`}
      />
      <SubscriptionInfoContainer>
        <SubscriptionInfoRowContainer
          label={t`Status`}
          Icon={IconCheck}
          currentValue={<Trans>Active</Trans>}
        />
      </SubscriptionInfoContainer>
    </Section.Root>
  );

  if (isAdminPanelTab) {
    return innerContent;
  }

  return (
    <SettingsPageLayout
      title={t`Organization`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: <Trans>Organization</Trans> },
      ]}
    >
      <SettingsPageContainer>{innerContent}</SettingsPageContainer>
    </SettingsPageLayout>
  );
};
