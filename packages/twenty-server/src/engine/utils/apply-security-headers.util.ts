import { type NextFunction, type Request, type Response } from 'express';

// Baseline headers for every API response. The frontend document sets its own
// stricter values downstream, so this only hardens non-document routes.
export const applySecurityHeaders = (
  _request: Request,
  response: Response,
  next: NextFunction,
): void => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
};
