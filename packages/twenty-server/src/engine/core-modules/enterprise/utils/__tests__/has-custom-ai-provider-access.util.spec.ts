import { hasCustomAiProviderAccess } from 'src/engine/core-modules/enterprise/utils/has-custom-ai-provider-access.util';

describe('hasCustomAiProviderAccess', () => {
  it('always grants access', () => {
    expect(
      hasCustomAiProviderAccess({
        isBillingEnabled: false,
        hasValidEnterprisePlan: false,
        seatCount: 10000,
      }),
    ).toBe(true);
  });
});
