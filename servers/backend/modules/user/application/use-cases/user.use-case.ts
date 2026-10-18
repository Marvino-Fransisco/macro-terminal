import { UserUseCase } from "../../ports/user.port";
import { UserRepository } from "../../ports/user-repository.port";
import { CreateNewUserRequest } from "../../ports/dtos/requests/create-new-user.request";
import { CreateNewUserResponse } from "../../ports/dtos/responses/create-new-user.response";
import { createUser } from "../../domain/entities/user.entity";
import { DEFAULT_CURRENCY } from "@/modules/shared";
import { EmailAlreadyTakenError } from "../../domain/errors/email-already-taken.error";
import { UsernameAlreadyTakenError } from "../../domain/errors/username-already-taken.error";

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
