import request from 'supertest';

/* global APP_PORT */

describe('Security headers', () => {
  it('omits the framework fingerprint header', async () => {
    const response = await request(`http://localhost:${APP_PORT}`).get(
      '/healthz',
    );

    expect(response.status).toBe(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('sends baseline security headers on non-document routes', async () => {
    const response = await request(`http://localhost:${APP_PORT}`).get(
      '/healthz',
    );

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
