import { UserCredential } from "../../domain/entities/user-credential.entity";

export interface UserCredentialRepository {
  createCredential(newUserCredential: UserCredential): Promise<UserCredential>;
}
