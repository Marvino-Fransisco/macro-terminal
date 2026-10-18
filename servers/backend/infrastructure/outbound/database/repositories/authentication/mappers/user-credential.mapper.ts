import { SelectUserCredentialsTable } from "@/infrastructure/outbound/database/schemas/user-credential.schema";
import { UserCredential } from "@/modules/authentication";

export function toUserCredentialEntity(row: SelectUserCredentialsTable): UserCredential {
  return {
    id: row.id,
    userId: row.userId,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    updatedAt: row.updatedAt,
  };
}
