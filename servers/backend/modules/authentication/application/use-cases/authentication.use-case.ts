import { CreateNewUserRequest, UserUseCase } from "@/modules/user";
import { AuthenticationUseCase, PasswordHasher, UserCredentialRepository } from "../ports";
import { RegisterRequest, RegisterResponse } from "../dtos";
import { createPassword } from "@/modules/shared";
import { createUserCredential } from "../../domain/entities/user-credential.entity";
import { ConfirmPasswordMismatchError } from "../errors/password.error";

export function createAuthenticationUseCase(
  userUseCase: UserUseCase,
  passwordHasher: PasswordHasher,
  authenticationRepository: UserCredentialRepository,
): AuthenticationUseCase {
  return {
    async register(request: RegisterRequest): Promise<RegisterResponse> {
      const { username, email, password, confirmPassword, locale, timeZone } = request;

      if (password !== confirmPassword) {
        throw new ConfirmPasswordMismatchError();
      }

      const validPassword = createPassword(password);
      const createNewUserRequest: CreateNewUserRequest = {
        username,
        email,
        locale,
        timeZone,
      }

      const hashedPassword = await passwordHasher.hash(validPassword);
      const createNewUserResponse = await userUseCase.createNewUser(createNewUserRequest);

      const newUserCredential = createUserCredential({
        userId: createNewUserResponse.userId,
        passwordHash: hashedPassword
      });

      const createdUserCredential = await authenticationRepository.createCredential(newUserCredential);
      return {
        userId: createdUserCredential.userId,
        token: "",
      };
    },
  };
}
