import request from 'supertest';

// DEV-01: Yoga must not reflect arbitrary Origins; Express owns CORS.
describe('CORS allowlist', () => {
  const evilOrigin = 'https://evil.example';
  // Matches FRONTEND_URL in .env.test, so it is allowlisted.
  const allowlistedOrigin = 'http://localhost:3001';

  it.each(['/graphql', '/metadata', '/admin-panel'])(
    'omits CORS headers for a disallowed origin on %s',
    async (path) => {
      const response = await request(global.app.getHttpServer())
        .post(path)
        .set('Origin', evilOrigin)
        .send({ query: '{ __typename }' });

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(
        response.headers['access-control-allow-credentials'],
      ).toBeUndefined();
    },
  );

  it('reflects an allowlisted origin with credentials on /graphql', async () => {
    const response = await request(global.app.getHttpServer())
      .post('/graphql')
      .set('Origin', allowlistedOrigin)
      .send({ query: '{ __typename }' });

    expect(response.headers['access-control-allow-origin']).toBe(
      allowlistedOrigin,
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('omits CORS headers on preflight from a disallowed origin', async () => {
    const response = await request(global.app.getHttpServer())
      .options('/graphql')
      .set('Origin', evilOrigin)
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
