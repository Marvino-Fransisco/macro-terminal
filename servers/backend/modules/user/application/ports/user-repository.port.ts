import { User } from "../../domain/entites/user.entity";

export interface UserRepository {
  findByUsername(username: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(newUser: User): Promise<User>;
}
