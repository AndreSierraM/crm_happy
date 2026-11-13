import { type ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { type I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { type MetricsService } from 'src/engine/core-modules/metrics/metrics.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type DataloaderService } from 'src/engine/dataloaders/dataloader.service';

import { adminPanelModuleFactory } from '../admin-panel.module-factory';

// The module class only fills the include array, so stub it to keep this unit test free of the full Nest graph.
jest.mock('src/engine/api/graphql/admin-panel-graphql-api.module', () => ({
  AdminPanelGraphQLApiModule: class MockAdminPanelGraphQLApiModule {},
}));

describe('adminPanelModuleFactory', () => {
  it('should disable Yoga CORS so Express owns the credentialed allowlist', async () => {
    const twentyConfigService = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'test' : 100)),
    } as unknown as TwentyConfigService;

    const config = await adminPanelModuleFactory(
      twentyConfigService,
      {} as ExceptionHandlerService,
      {} as DataloaderService,
      {} as MetricsService,
      {} as I18nService,
    );

    expect(config.cors).toBe(false);
  });
});
