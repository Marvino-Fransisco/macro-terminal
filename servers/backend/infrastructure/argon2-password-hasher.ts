import argon2 from "argon2";
import { PasswordHasher } from "../modules/shared";

export const argon2PasswordHasher: PasswordHasher = {
  async hash(password): Promise<string> {
    return await argon2.hash(password);
  },

  async verify(password, hashedPassword): Promise<boolean> {
    return await argon2.verify(hashedPassword, password);
  }
}
