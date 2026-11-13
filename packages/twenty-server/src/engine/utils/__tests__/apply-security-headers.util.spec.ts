import { type NextFunction, type Request, type Response } from 'express';

import { applySecurityHeaders } from 'src/engine/utils/apply-security-headers.util';

describe('applySecurityHeaders', () => {
  it('should set the baseline headers and continue the chain', () => {
    const headers: Record<string, string> = {};
    const response = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
    } as unknown as Response;
    const next: NextFunction = jest.fn();

    applySecurityHeaders({} as Request, response, next);

    expect(headers).toEqual({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
