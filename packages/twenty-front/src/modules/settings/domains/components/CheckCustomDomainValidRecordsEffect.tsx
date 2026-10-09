
import { useCheckCustomDomainValidRecords } from '@/settings/domains/hooks/useCheckCustomDomainValidRecords';
import { useEffect } from 'react';

export const CheckCustomDomainValidRecordsEffect = () => {
  const { checkCustomDomainRecords } = useCheckCustomDomainValidRecords();

  useEffect(() => {
    checkCustomDomainRecords();
    // Check custom domain only needs to run once at mount
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};
