import { type INestApplication } from '@nestjs/common';

// Omit framework fingerprint header
export const disablePoweredByHeader = (app: INestApplication): void => {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
};
