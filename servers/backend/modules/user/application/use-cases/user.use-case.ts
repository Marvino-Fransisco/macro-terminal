import { UserUseCase, UserRepository } from "../ports";
import { CreateNewUserRequest, CreateNewUserResponse } from "../dtos";
import { createUser } from "../../domain/entites/user.entity";
import { DEFAULT_CURRENCY } from "@/modules/shared";
import { EmailAlreadyTakenError } from "../errors/email.error";
import { UsernameAlreadyTakenError } from "../errors/username.error";

export function createUserUseCase(
  userRepository: UserRepository,
): UserUseCase {
  return {
    async createNewUser(request: CreateNewUserRequest): Promise<CreateNewUserResponse> {
      const { username, email, locale, timeZone } = request;

      const existingUserEmail = await userRepository.findByEmail(email);
      if (existingUserEmail) {
        throw new EmailAlreadyTakenError();
      }

      const existingUserUsername = await userRepository.findByUsername(username);
      if (existingUserUsername) {
        throw new UsernameAlreadyTakenError();
      }

      const newUser = createUser({
        username,
        email,
        displayName: username,
        locale,
        timeZone,
        defaultCurrency: DEFAULT_CURRENCY,
      });

      const createdUser = await userRepository.create(newUser);

      return {
        userId: createdUser.id,
      };
    }
  }
}
