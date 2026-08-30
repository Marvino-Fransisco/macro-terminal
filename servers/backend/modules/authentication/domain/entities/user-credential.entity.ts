import { Entity } from "../../../shared";
import { CreateUserCredentialInput } from "../types/create-user-credential.input";

export type UserCredential = Entity & {
  userId: string;
  passwordHash: string;
}

export function createUserCredential(createUserCredentialInput: CreateUserCredentialInput): UserCredential {
  const { userId, passwordHash } = createUserCredentialInput;

  return {
    userId,
    passwordHash
  } as UserCredential;
}
