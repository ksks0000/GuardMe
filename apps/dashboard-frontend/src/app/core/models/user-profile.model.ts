/* Mirrors backend PublicUserProfileDto  */
export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
  lastAuthAt: string | null;
}
