import { Password } from "../../../shared";

export interface PasswordHasher {
  hash(password: Password): Promise<string>;
  verify(password: Password, hashedPassword: string): Promise<boolean>;
}
