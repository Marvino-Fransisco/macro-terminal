import { SelectUserIdentitiesTable } from "@/infrastructure/database/schemas/user-identity.schema";
import { UserIdentity } from "@/modules/authentication";

export function toUserIdentity(row: SelectUserIdentitiesTable): UserIdentity {
  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider,
    providerUserId: row.providerUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}
