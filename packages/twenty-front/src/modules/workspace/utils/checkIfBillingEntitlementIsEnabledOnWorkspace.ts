import { type CurrentWorkspace } from '@/auth/states/currentWorkspaceState';
import { type BillingEntitlementKey } from '~/generated-metadata/graphql';

export const checkIfBillingEntitlementIsEnabledOnWorkspace = (
  _entitlementKey: BillingEntitlementKey,
  _workspace: CurrentWorkspace | null | undefined,
) => true;
