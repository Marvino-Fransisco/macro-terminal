import { CreateNewUserRequest, CreateNewUserResponse } from "../dtos";

export interface UserUseCase {
  createNewUser(request: CreateNewUserRequest): Promise<CreateNewUserResponse>;
}
