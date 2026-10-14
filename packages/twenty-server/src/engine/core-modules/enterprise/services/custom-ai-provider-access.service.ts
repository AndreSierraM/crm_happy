

import { Injectable } from '@nestjs/common';

import { MAX_SEATS_WITHOUT_ENTERPRISE_KEY } from 'src/engine/core-modules/enterprise/constants/max-seats-without-organization-key.constant';

export type CustomAiProviderAccess = {
  hasAccess: boolean;
  seatCount: number;
  seatThreshold: number;
};

@Injectable()
export class CustomAiProviderAccessService {
  constructor() {}

  async computeAccess(): Promise<CustomAiProviderAccess> {
    return {
      hasAccess: true,
      seatCount: 0,
      seatThreshold: MAX_SEATS_WITHOUT_ENTERPRISE_KEY,
    };
  }

  getCachedHasAccess(): boolean {
    return true;
  }
}
