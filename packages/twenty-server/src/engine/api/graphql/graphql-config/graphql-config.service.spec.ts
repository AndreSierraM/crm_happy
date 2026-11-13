import { type ModuleRef } from '@nestjs/core';

import { type DirectExecutionService } from 'src/engine/api/graphql/direct-execution/direct-execution.service';
import { GraphQLConfigService } from 'src/engine/api/graphql/graphql-config/graphql-config.service';
import { type ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { type FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { type I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type DataloaderService } from 'src/engine/dataloaders/dataloader.service';

// The module classes only fill the include array, so stub them to keep this unit test free of the full Nest graph.
jest.mock('src/engine/core-modules/core-engine.module', () => ({
  CoreEngineModule: class MockCoreEngineModule {},
}));

jest.mock('src/modules/modules.module', () => ({
  ModulesModule: class MockModulesModule {},
}));

describe('GraphQLConfigService', () => {
  it('should disable Yoga CORS so Express owns the credentialed allowlist', () => {
    const twentyConfigService = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : 100)),
    } as unknown as TwentyConfigService;

    const service = new GraphQLConfigService(
      {} as ExceptionHandlerService,
      twentyConfigService,
      {} as ModuleRef,
      {} as MetricsService,
      {} as DataloaderService,
      {} as I18nService,
      {} as DirectExecutionService,
      {} as FeatureFlagService,
    );

    expect(service.createGqlOptions().cors).toBe(false);
  });
});
