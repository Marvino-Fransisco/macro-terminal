import { UserCredential } from "../../domain/entities/user-credential.entity";

export interface UserCredentialRepository {
  createCredential(userCredential: UserCredential): Promise<UserCredential>;
}
