import { UserProfile } from '../../models';
import { AuthMeResponse, PublicUserProfileResponse } from './auth-api.types';

export function mapPublicUserProfile(dto: PublicUserProfileResponse): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    createdAt: dto.createdAt,
    lastAuthAt: dto.lastAuthAt,
  };
}

// /auth/me omits profile timestamps; username and id are sufficient for session restore
export function mapAuthMeProfile(dto: AuthMeResponse): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    createdAt: '',
    lastAuthAt: null,
  };
}
