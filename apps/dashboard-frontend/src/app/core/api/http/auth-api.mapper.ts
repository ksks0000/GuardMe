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

export function mapAuthMeProfile(dto: AuthMeResponse): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    createdAt: '',
    lastAuthAt: dto.lastAuthAt,
  };
}
