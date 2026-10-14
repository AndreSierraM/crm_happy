

type HasCustomAiProviderAccessArgs = {
  isBillingEnabled: boolean;
  hasValidEnterprisePlan: boolean;
  seatCount: number;
};

// All premium features are enabled without an Organization key.
export const hasCustomAiProviderAccess = (
  _args?: HasCustomAiProviderAccessArgs,
): boolean => true;
