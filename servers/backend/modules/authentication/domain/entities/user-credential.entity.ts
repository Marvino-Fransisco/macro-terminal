import { Entity } from "../../../shared";

export type UserCredential = Entity & {
  userId: string;
  passwordHash: string;
}

export type UserCredentialInput = Omit<UserCredential, keyof Entity>;

export function createUserCredential(userCredentialInput: UserCredentialInput): UserCredential {
  const { userId, passwordHash } = userCredentialInput;

  return {
    userId,
    passwordHash
  } as UserCredential;
}
