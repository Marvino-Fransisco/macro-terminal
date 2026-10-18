import { CreateNewUserRequest, UserUseCase } from "@/modules/user";
import { AuthenticationUseCase } from "../../ports/authentication.port";
import { PasswordHasher } from "../../ports/password-hasher.port";
import { UserCredentialRepository } from "../../ports/user-credential-repository.port";
import { RegisterRequest } from "../../ports/dtos/requests/register.request";
import { RegisterResponse } from "../../ports/dtos/responses/register.response";
import { createPassword, UnitOfWork } from "@/modules/shared";
import { createUserCredential } from "../../domain/entities/user-credential.entity";
import { ConfirmPasswordMismatchError } from "../../domain/errors/confirm-password-mismatch.error";

export function createAuthenticationUseCase(
  unitOfWork: UnitOfWork,
  userUseCase: UserUseCase,
  passwordHasher: PasswordHasher,
  authenticationRepository: UserCredentialRepository,
): AuthenticationUseCase {
  return {
    async register(request: RegisterRequest): Promise<RegisterResponse> {
      return unitOfWork.run(async () => {
        const { username, email, password, confirmPassword, locale, timeZone } = request;

        if (password !== confirmPassword) {
          throw new ConfirmPasswordMismatchError();
        }

        const validPassword = createPassword(password);
        const hashedPassword = await passwordHasher.hash(validPassword);

        const createNewUserRequest: CreateNewUserRequest = {
          username,
          email,
          locale,
          timeZone,
        }

        const createNewUserResponse = await userUseCase.createNewUser(createNewUserRequest);
        const userCredentialInput = {
          userId: createNewUserResponse.userId,
          passwordHash: hashedPassword

        }

        const newUserCredential = createUserCredential(userCredentialInput);
        const createdUserCredential = await authenticationRepository.createCredential(newUserCredential);

        return {
          userId: createdUserCredential.userId,
          token: "",
        };
      });
    },
  };
}
