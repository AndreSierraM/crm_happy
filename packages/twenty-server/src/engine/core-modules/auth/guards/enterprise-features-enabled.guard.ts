

import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class EnterpriseFeaturesEnabledGuard implements CanActivate {
  async canActivate(_context: ExecutionContext): Promise<boolean> {
    return true;
  }
}
