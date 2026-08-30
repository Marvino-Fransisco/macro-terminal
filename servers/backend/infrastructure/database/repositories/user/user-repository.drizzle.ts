import { Database } from "@/infrastructure/database/connections/supabase.connection";
import { usersTable } from "@/infrastructure/database/schemas/user.schema";
import { UserRepository } from "@/modules/user";
import { eq } from "drizzle-orm";
import { toUserEntity } from "./mappers/user.mapper";
import { FailedToCreateUserError } from "./errors/user-repository.error";
import { getConnection } from "../../unit-of-work/unit-of-work.drizzle";

export function createUserRepository(
  db: Database
): UserRepository {
  return {
    async findByUsername(username) {
      const [user] = await getConnection(db)
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username));

      if (!user) {
        return undefined;
      }

      return toUserEntity(user);
    },

    async findByEmail(email) {
      const [user] = await getConnection(db)
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return undefined;
      }

      return toUserEntity(user);
    },

    async create(newUser) {
      const [user] = await getConnection(db)
        .insert(usersTable)
        .values(newUser)
        .returning();

      if (!user) {
        throw new FailedToCreateUserError();
      }

      return toUserEntity(user);
    }
  }
}
