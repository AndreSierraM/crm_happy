

import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { EnterpriseLicenseInfoDTO } from 'src/engine/core-modules/enterprise/dtos/enterprise-license-info.dto';
import { EnterpriseSubscriptionStatusDTO } from 'src/engine/core-modules/enterprise/dtos/enterprise-subscription-status.dto';
import { EnterpriseExceptionFilter } from 'src/engine/core-modules/enterprise/enterprise-exception.filter';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AdminPanelGuard } from 'src/engine/guards/admin-panel-guard';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { BillingDisabledGuard } from 'src/engine/guards/billing-disabled.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

@Resolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  BillingDisabledGuard,
  AdminPanelGuard,
  NoPermissionGuard,
)
@UsePipes(ResolverValidationPipe)
@UseFilters(EnterpriseExceptionFilter, PreventNestToAutoLogGraphqlErrorsFilter)
export class EnterpriseResolver {
  constructor(private readonly enterprisePlanService: EnterprisePlanService) {}

  @Query(() => String, { nullable: true })
  async enterprisePortalSession(
    @Args('returnUrlPath', { nullable: true }) returnUrlPath?: string,
  ): Promise<string | null> {
    return this.enterprisePlanService.getPortalUrl(returnUrlPath ?? undefined);
  }

  @Query(() => String, { nullable: true })
  async enterpriseCheckoutSession(
    @Args('billingInterval', { nullable: true }) billingInterval?: string,
  ): Promise<string | null> {
    const interval = billingInterval === 'yearly' ? 'yearly' : 'monthly';
    const seatCount = await this.enterprisePlanService.getBillableSeatCount();

    return this.enterprisePlanService.getCheckoutUrl(interval, seatCount);
  }

  @Query(() => EnterpriseSubscriptionStatusDTO, { nullable: true })
  async enterpriseSubscriptionStatus(): Promise<EnterpriseSubscriptionStatusDTO | null> {
    return this.enterprisePlanService.getSubscriptionStatus();
  }

  @Mutation(() => Boolean)
  async refreshEnterpriseValidityToken(): Promise<boolean> {
    return this.enterprisePlanService.refreshValidityToken();
  }

  @Mutation(() => EnterpriseLicenseInfoDTO)
  async releaseEnterpriseServerBinding(): Promise<EnterpriseLicenseInfoDTO> {
    return this.enterprisePlanService.getLicenseInfo();
  }

  @Mutation(() => EnterpriseLicenseInfoDTO)
  async setEnterpriseKey(
    @Args('enterpriseKey') _enterpriseKey: string,
  ): Promise<EnterpriseLicenseInfoDTO> {
    return this.enterprisePlanService.getLicenseInfo();
  }
}
