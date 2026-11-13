import { type CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { type ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { type FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { type I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type DataloaderService } from 'src/engine/dataloaders/dataloader.service';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

import { metadataModuleFactory } from '../metadata.module-factory';

// The module classes only fill the include array, so stub them to keep this unit test free of the full Nest graph.
jest.mock('src/engine/api/graphql/metadata-graphql-api.module', () => ({
  MetadataGraphQLApiModule: class MockMetadataGraphQLApiModule {},
}));

jest.mock('src/modules/modules.module', () => ({
  ModulesModule: class MockModulesModule {},
}));

describe('metadataModuleFactory', () => {
  it('should disable Yoga CORS so Express owns the credentialed allowlist', async () => {
    const twentyConfigService = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : 100)),
    } as unknown as TwentyConfigService;

    const config = await metadataModuleFactory(
      twentyConfigService,
      {} as ExceptionHandlerService,
      {} as DataloaderService,
      { get: jest.fn(), set: jest.fn() } as unknown as CacheStorageService,
      {} as MetricsService,
      {} as I18nService,
      {} as FeatureFlagService,
      {
        getOrRecomputeCombinedHash: jest.fn(),
      } as unknown as WorkspaceCacheService,
    );

    expect(config.cors).toBe(false);
  });
});
