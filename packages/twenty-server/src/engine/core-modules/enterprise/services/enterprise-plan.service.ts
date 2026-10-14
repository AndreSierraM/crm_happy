import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 } from 'uuid';

import {
    type EnterpriseLicenseInfo,
} from 'src/engine/core-modules/enterprise/types/organization-key-payload.type';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

@Injectable()
export class EnterprisePlanService implements OnModuleInit {
  static readonly ENTERPRISE_KEY_BOUND_TO_ANOTHER_SERVER_CODE =
    'ENTERPRISE_KEY_BOUND_TO_ANOTHER_SERVER';

  static readonly ENTERPRISE_VALIDITY_TOKEN_RATE_LIMITED_CODE =
    'ENTERPRISE_VALIDITY_TOKEN_RATE_LIMITED';

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  async onModuleInit() {}

  hasValidSignedEnterpriseKey(): boolean {
    return true;
  }

  hasValidEnterpriseValidityToken(): boolean {
    return true;
  }

  async isValidWithFreshToken(): Promise<boolean> {
    return true;
  }

  isValid(): boolean {
    return true;
  }

  isValidEnterpriseKeyFormat(_key: string): boolean {
    return true;
  }

  async getLicenseInfo(): Promise<EnterpriseLicenseInfo> {
    return {
      isValid: true,
      licensee: null,
      expiresAt: null,
      subscriptionId: null,
    };
  }

  async setEnterpriseKey(_enterpriseKey: string): Promise<void> {}

  getLastRefreshRejectionCode(): string | null {
    return null;
  }

  async refreshValidityToken(): Promise<boolean> {
    return true;
  }

  async getBillableSeatCount(): Promise<number> {
    const result = await this.userWorkspaceRepository
      .createQueryBuilder('userWorkspace')
      .select('COUNT(DISTINCT "userWorkspace"."userId")', 'distinctUserCount')
      .where('"userWorkspace"."deletedAt" IS NULL')
      .getRawOne<{ distinctUserCount: string }>();

    return Math.max(1, Number(result?.distinctUserCount ?? 0));
  }

  async reportSeats(_seatCount: number): Promise<boolean> {
    return true;
  }

  async releaseServerBinding(): Promise<boolean> {
    return true;
  }

  async getSubscriptionStatus(): Promise<{
    status: string;
    licensee: string | null;
    expiresAt: Date | null;
    cancelAt: Date | null;
    currentPeriodEnd: Date | null;
    isCancellationScheduled: boolean;
  }> {
    return {
      status: 'active',
      licensee: null,
      expiresAt: null,
      cancelAt: null,
      currentPeriodEnd: null,
      isCancellationScheduled: false,
    };
  }

  async getPortalUrl(_returnUrl?: string): Promise<string | null> {
    return null;
  }

  async getCheckoutUrl(
    _billingInterval: 'monthly' | 'yearly' = 'monthly',
    _seatCount: number,
  ): Promise<string | null> {
    return null;
  }

  async getOrCreateServerId(): Promise<string | null> {
    const existingServerId = this.twentyConfigService.get('SERVER_ID');

    if (existingServerId) {
      return existingServerId;
    }

    return v4();
  }
}
