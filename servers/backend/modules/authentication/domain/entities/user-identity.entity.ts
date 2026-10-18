import { Entity } from "../../../shared";
import { AuthProvider } from "../value-objects/auth-provider.vo";

export type UserIdentity = Entity & {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
}

export type UserIdentityInput = Omit<UserIdentity, keyof Entity>;
