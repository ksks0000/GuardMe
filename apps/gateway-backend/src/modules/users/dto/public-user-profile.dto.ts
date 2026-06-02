export interface PublicUserProfileDto {
  id: string;
  username: string;
  createdAt: Date;
  lastAuthAt: Date | null;
}
