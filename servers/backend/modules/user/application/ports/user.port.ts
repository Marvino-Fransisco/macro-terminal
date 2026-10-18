import { CreateNewUserRequest } from "../dtos/requests/create-new-user.request";
import { CreateNewUserResponse } from "../dtos/responses/create-new-user.response";

export interface UserUseCase {
  createNewUser(request: CreateNewUserRequest): Promise<CreateNewUserResponse>;
}
