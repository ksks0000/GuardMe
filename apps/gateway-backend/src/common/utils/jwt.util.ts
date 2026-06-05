import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/auth.types';

export async function verifyJwtPayload(
  jwtService: JwtService,
  token: string,
  options?: { ignoreExpiration?: boolean },
): Promise<JwtPayload | null> {
  try {
    return await jwtService.verifyAsync<JwtPayload>(token, {
      ignoreExpiration: options?.ignoreExpiration ?? false,
    });
  } catch {
    return null;
  }
}
