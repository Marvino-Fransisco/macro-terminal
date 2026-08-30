import { Database } from "@/infrastructure/database/connections/supabase.connection";
import { userCredentialsTable } from "@/infrastructure/database/schemas/user-credential.schema";
import { UserCredentialRepository } from "@/modules/authentication";
import { FailedToCreateUserCredentialError } from "./errors/user-credential.error";
import { toUserCredentialEntity } from "./mappers/user-credential.mapper";
import { getConnection } from "../../unit-of-work/unit-of-work.drizzle";

export function createUserCredentialRepository(
  db: Database
): UserCredentialRepository {
  return {
    async createCredential(newUserCredential) {
      const [userCredential] = await getConnection(db)
        .insert(userCredentialsTable)
        .values(newUserCredential)
        .returning();

      if (!userCredential) {
        throw new FailedToCreateUserCredentialError();
      }

      return toUserCredentialEntity(userCredential);
    },
  }
}
